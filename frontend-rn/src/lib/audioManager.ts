// Web Audio API DSP Engine for Ngalagu DJ Mixer and Jedag-Jedug visualizer

class DJAudioManager {
  private ctx: AudioContext | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;

  // EQ nodes
  private lowFilter: BiquadFilterNode | null = null;
  private midFilter: BiquadFilterNode | null = null;
  private highFilter: BiquadFilterNode | null = null;

  // Effects nodes
  private delayNode: DelayNode | null = null;
  private feedbackGain: GainNode | null = null;
  private distortionNode: WaveShaperNode | null = null;
  private jedagGain: GainNode | null = null;
  
  // Stutter LFO interval
  private stutterInterval: any = null;

  // State
  private isJedagJedug = false;

  init(audioElement: HTMLAudioElement) {
    if (this.ctx) {
      // Reconnect if context already exists
      return;
    }

    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.source = this.ctx.createMediaElementSource(audioElement);
      
      // Analyser node for Jedag-Jedug strobe visualization
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;

      // Equalizer filters (3-band EQ)
      this.lowFilter = this.ctx.createBiquadFilter();
      this.lowFilter.type = 'lowshelf';
      this.lowFilter.frequency.value = 250; // Bass frequency limit
      this.lowFilter.gain.value = 0;

      this.midFilter = this.ctx.createBiquadFilter();
      this.midFilter.type = 'peaking';
      this.midFilter.Q.value = 1.0;
      this.midFilter.frequency.value = 1000; // Midrange
      this.midFilter.gain.value = 0;

      this.highFilter = this.ctx.createBiquadFilter();
      this.highFilter.type = 'highshelf';
      this.highFilter.frequency.value = 4000; // Treble
      this.highFilter.gain.value = 0;

      // Echo (Delay & Feedback)
      this.delayNode = this.ctx.createDelay(1.0);
      this.delayNode.delayTime.value = 0.35; // 350ms delay
      this.feedbackGain = this.ctx.createGain();
      this.feedbackGain.gain.value = 0.0; // feedback amount (starts at 0)

      // Connect delay loop
      this.delayNode.connect(this.feedbackGain);
      this.feedbackGain.connect(this.delayNode);

      // Distortion
      this.distortionNode = this.ctx.createWaveShaper();
      this.distortionNode.curve = this.makeDistortionCurve(0);
      this.distortionNode.oversample = '4x';

      // Jedag Stutter Gain Node
      this.jedagGain = this.ctx.createGain();
      this.jedagGain.gain.value = 1.0;

      // Connect DSP Chain:
      // Source -> EQ (Low -> Mid -> High) -> Distortion -> Delay Mixer -> Jedag Gain -> Analyser -> Destination
      this.source.connect(this.lowFilter);
      this.lowFilter.connect(this.midFilter);
      this.midFilter.connect(this.highFilter);
      this.highFilter.connect(this.distortionNode);
      
      // Parallel delay node path
      this.distortionNode.connect(this.jedagGain);
      this.distortionNode.connect(this.delayNode);
      this.delayNode.connect(this.jedagGain);

      this.jedagGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    } catch (e) {
      console.error('Failed to initialize Web Audio API Context', e);
    }
  }

  // Generate distortion curves
  private makeDistortionCurve(amount: number): Float32Array {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  setEq(low: number, mid: number, high: number) {
    if (this.lowFilter) this.lowFilter.gain.value = low;
    if (this.midFilter) this.midFilter.gain.value = mid;
    if (this.highFilter) this.highFilter.gain.value = high;
  }

  setEcho(enabled: boolean) {
    if (this.feedbackGain) {
      this.feedbackGain.gain.setValueAtTime(enabled ? 0.45 : 0.0, this.ctx?.currentTime || 0);
    }
  }

  setDistortion(enabled: boolean) {
    if (this.distortionNode) {
      this.distortionNode.curve = enabled ? this.makeDistortionCurve(80) : this.makeDistortionCurve(0);
    }
  }

  // Jedag-Jedug Mode: Heavy Bass Boost + Fast Rhythmic Gate + Strobe visualizer
  setJedagJedug(enabled: boolean) {
    this.isJedagJedug = enabled;
    if (enabled) {
      // 1. Heavy bass boost (gain of +18dB at bass shelf)
      if (this.lowFilter) this.lowFilter.gain.value = 18;
      
      // 2. Rhythmic chopper/stutter (amplitude LFO)
      if (this.stutterInterval) clearInterval(this.stutterInterval);
      let count = 0;
      this.stutterInterval = setInterval(() => {
        if (!this.jedagGain || !this.ctx) return;
        // Periodic drop in volume to match DJ gate effect (130 BPM sync)
        const targetGain = count % 4 === 0 ? 0.2 : 1.0;
        this.jedagGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
        count++;
      }, 115); // Stutter timing
    } else {
      // Restore defaults
      if (this.lowFilter) this.lowFilter.gain.value = 0;
      if (this.jedagGain && this.ctx) {
        this.jedagGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      }
      if (this.stutterInterval) {
        clearInterval(this.stutterInterval);
        this.stutterInterval = null;
      }
    }
  }

  // Analyze low-frequency bass levels to trigger beat flash animations in frontend
  getBassIntensity(): number {
    if (!this.analyser) return 0;
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    // Bass frequencies are usually in the first few bins (indices 0 to 10)
    let bassSum = 0;
    const bins = 8;
    for (let i = 0; i < bins; i++) {
      bassSum += dataArray[i];
    }
    return bassSum / bins; // scale from 0 to 255
  }

  getAudioContext() {
    return this.ctx;
  }
}

export const audioManager = new DJAudioManager();
export default audioManager;

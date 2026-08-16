<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\History;

class HistoryController extends Controller
{
    public function index(Request $request)
    {
        $histories = History::with('track')
            ->where('user_id', $request->user()->id)
            ->latest()
            ->take(50)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $histories
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $history = History::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();
            
        $history->delete();

        return response()->json([
            'success' => true,
            'message' => 'History item deleted'
        ]);
    }
}

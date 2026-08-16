<?php
// Since SQLite extension is not available in this environment, 
// we'll use a JSON-based flat file database for mock storage.

if (!class_exists('JsonDB')) {
class JsonDB {
    private $file;
    private $data;

    public function __construct($file) {
        $this->file = $file;
        if (file_exists($this->file)) {
            $this->data = json_decode(file_get_contents($this->file), true) ?: [
                'users' => [], 
                'sessions' => [], 
                'ip_management' => [],
                'history' => [],
                'liked_tracks' => [],
                'liked_albums' => [],
                'uploaded_tracks' => []
            ];
            // Ensure all keys exist
            foreach (['history', 'liked_tracks', 'liked_albums', 'uploaded_tracks'] as $k) {
                if (!isset($this->data[$k])) {
                    $this->data[$k] = [];
                }
            }
        } else {
            $this->data = [
                'users' => [], 
                'sessions' => [], 
                'ip_management' => [],
                'history' => [],
                'liked_tracks' => [],
                'liked_albums' => [],
                'uploaded_tracks' => []
            ];
            $this->save();
        }
    }

    private function save() {
        file_put_contents($this->file, json_encode($this->data, JSON_PRETTY_PRINT));
    }

    public function getTable($table) {
        return $this->data[$table] ?? [];
    }

    public function insert($table, $row) {
        if (!isset($row['id'])) {
            $row['id'] = count($this->data[$table]) + 1;
        }
        if (!isset($row['created_at'])) {
            $row['created_at'] = date('Y-m-d H:i:s');
        }
        $this->data[$table][] = $row;
        $this->save();
        return $row['id'];
    }

    public function findBy($table, $key, $value) {
        foreach ($this->data[$table] as $row) {
            if ($row[$key] === $value) {
                return $row;
            }
        }
        return null;
    }

    public function updateBy($table, $key, $value, $updates) {
        $updated = false;
        foreach ($this->data[$table] as &$row) {
            if ($row[$key] === $value) {
                foreach ($updates as $k => $v) {
                    $row[$k] = $v;
                }
                $updated = true;
                break;
            }
        }
        if ($updated) {
            $this->save();
        }
        return $updated;
    }

    public function deleteBy($table, $key, $value) {
        $initialCount = count($this->data[$table]);
        $this->data[$table] = array_values(array_filter($this->data[$table], function($row) use ($key, $value) {
            return $row[$key] !== $value;
        }));
        if (count($this->data[$table]) !== $initialCount) {
            $this->save();
            return true;
        }
        return false;
    }
}
}

$dbPath = __DIR__ . '/storage/database.json';
return new JsonDB($dbPath);

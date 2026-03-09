<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FeeConfig;

class FeeController extends Controller
{
    public function index()
    {
        return response()->json(FeeConfig::where('is_active', true)->get());
    }
}

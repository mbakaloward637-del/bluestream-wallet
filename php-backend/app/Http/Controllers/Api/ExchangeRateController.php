<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExchangeRate;

class ExchangeRateController extends Controller
{
    public function index()
    {
        return response()->json(ExchangeRate::where('is_active', true)->get());
    }
}

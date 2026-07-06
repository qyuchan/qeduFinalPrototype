<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        apiPrefix: 'api',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias(['auth' => \App\Http\Middleware\Authenticate::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, \Illuminate\Http\Request $request) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        });
        $exceptions->render(function (\Symfony\Component\Routing\Exception\RouteNotFoundException $e, \Illuminate\Http\Request $request) {
            if (str_starts_with($request->path(), 'api/')) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }
        });
    })->create();

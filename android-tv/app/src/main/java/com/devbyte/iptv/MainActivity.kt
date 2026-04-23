package com.devbyte.iptv

import android.graphics.Bitmap
import android.annotation.SuppressLint
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.ProgressBar
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar

    private val serverUrl = BuildConfig.SERVER_URL

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        WindowCompat.setDecorFitsSystemWindows(window, false)

        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        progressBar = findViewById(R.id.progressBar)

setupWebView()

        webView.requestFocus()
        webView.requestFocusFromTouch()

        webView.loadUrl(serverUrl)

        Handler(Looper.getMainLooper()).postDelayed({
            if (progressBar.visibility == View.VISIBLE) {
                progressBar.visibility = View.GONE
                Toast.makeText(this, "Timeout de carga. Verifica la conexion.", Toast.LENGTH_LONG).show()
            }
        }, 15000)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
            mediaPlaybackRequiresUserGesture = false
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            cacheMode = WebSettings.LOAD_DEFAULT
            useWideViewPort = true
            loadWithOverviewMode = true
            setSupportZoom(false)
        }

        webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null)

        webView.addJavascriptInterface(AndroidBridge(this, webView), "AndroidBridge")

        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                progressBar.visibility = View.VISIBLE
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                progressBar.visibility = View.GONE
                if (url == null || url == "about:blank") {
                    view?.loadUrl(serverUrl)
                } else {
                    webView.evaluateJavascript(
                        "window.IS_ANDROID_APP = true; window.ANDROID_API_URL = '${BuildConfig.API_URL}';",
                        null
                    )
                }
            }

            @Deprecated("Deprecated in Java")
    @Suppress("DEPRECATION")
    override fun onReceivedError(view: WebView?, errorCode: Int, description: String?, failingUrl: String?) {
                progressBar.visibility = View.GONE
                Toast.makeText(this@MainActivity, "Error: $description", Toast.LENGTH_SHORT).show()
            }

            override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: WebResourceRequest?
            ): Boolean {
                val url = request?.url?.toString() ?: return false
                return if (url.startsWith(serverUrl) || url.startsWith("http://192.168")) {
                    false
                } else {
                    true
                }
            }
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) hideSystemUI()
    }

    private fun hideSystemUI() {
        WindowInsetsControllerCompat(window, window.decorView).apply {
            hide(WindowInsetsCompat.Type.systemBars())
            systemBarsBehavior =
                WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        }
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (event.action != KeyEvent.ACTION_DOWN) return super.dispatchKeyEvent(event)

        val jsAction = when (event.keyCode) {
            KeyEvent.KEYCODE_DPAD_UP -> "up"
            KeyEvent.KEYCODE_DPAD_DOWN -> "down"
            KeyEvent.KEYCODE_DPAD_LEFT -> "left"
            KeyEvent.KEYCODE_DPAD_RIGHT -> "right"
            KeyEvent.KEYCODE_DPAD_CENTER,
            KeyEvent.KEYCODE_ENTER -> "enter"
            KeyEvent.KEYCODE_BACK -> "back"
            KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE -> "playpause"
            KeyEvent.KEYCODE_MEDIA_PLAY -> "play"
            KeyEvent.KEYCODE_MEDIA_PAUSE -> "pause"
            KeyEvent.KEYCODE_0 -> "num0"
            KeyEvent.KEYCODE_1 -> "num1"
            KeyEvent.KEYCODE_2 -> "num2"
            KeyEvent.KEYCODE_3 -> "num3"
            KeyEvent.KEYCODE_4 -> "num4"
            KeyEvent.KEYCODE_5 -> "num5"
            KeyEvent.KEYCODE_6 -> "num6"
            KeyEvent.KEYCODE_7 -> "num7"
            KeyEvent.KEYCODE_8 -> "num8"
            KeyEvent.KEYCODE_9 -> "num9"
            KeyEvent.KEYCODE_PROG_RED -> "red"
            KeyEvent.KEYCODE_PROG_GREEN -> "green"
            KeyEvent.KEYCODE_PROG_YELLOW -> "yellow"
            KeyEvent.KEYCODE_PROG_BLUE -> "blue"
            else -> null
        }

        if (jsAction != null) {
            webView.evaluateJavascript(
                "window.handleAndroidKey && window.handleAndroidKey(${event.keyCode})",
                null
            )
            return true
        }

        return super.dispatchKeyEvent(event)
    }

    @Suppress("DEPRECATION")
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            webView.evaluateJavascript(
                "window.handleAndroidKey && window.handleAndroidKey(8)",
                null
            )
        }
    }
}
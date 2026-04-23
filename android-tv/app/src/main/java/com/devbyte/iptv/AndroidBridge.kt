package com.devbyte.iptv

import android.content.Context
import android.net.ConnectivityManager
import android.webkit.JavascriptInterface
import android.webkit.WebView

class AndroidBridge(
    private val context: Context,
    private val webView: WebView
) {

    @JavascriptInterface
    fun getDeviceType(): String {
        return "ANDROID_APP"
    }

    @JavascriptInterface
    fun getNetworkSpeed(): String {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val nc = cm.getNetworkCapabilities(cm.activeNetwork) ?: return "HD"
        val downMbps = nc.linkDownstreamBandwidthKbps / 1000
        return when {
            downMbps >= 15 -> "FHD"
            downMbps >= 5 -> "HD"
            else -> "SD"
        }
    }

    @JavascriptInterface
    fun showToast(message: String) {
        android.widget.Toast.makeText(context, message, android.widget.Toast.LENGTH_SHORT).show()
    }
}
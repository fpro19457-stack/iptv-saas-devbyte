# 🔄 UPDATE 3 — Prompts para OpenCode
# APK Android — TV Box + Celulares Android
# Requiere Updates 1 y 2 completadas.
# ⚠️ Esta update requiere Android Studio instalado.

---

## ANTES DE EMPEZAR — Instalar Android Studio

```
1. Descargar Android Studio: https://developer.android.com/studio
2. Instalar con configuración por defecto
3. En SDK Manager instalar:
   - Android SDK Platform 34 (Android 14)
   - Android SDK Platform 21 (Android 5 — mínimo)
   - Android Emulator
   - Android SDK Build-Tools
4. Verificar que Java 17+ está instalado:
   java -version
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PROMPT 3.1 — Setup proyecto Android base
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
Crear un nuevo proyecto Android en la carpeta iptv-saas-devbyte/android-tv/

Configuración del proyecto en Android Studio:
- Nombre: IPTV DevByte
- Package name: com.devbyte.iptv
- Lenguaje: Kotlin
- Minimum SDK: API 21 (Android 5.0) — cubre la mayoría de TV Box
- Template: Empty Activity

En app/build.gradle agregar dependencias:
dependencies {
    // ExoPlayer para video
    implementation 'androidx.media3:media3-exoplayer:1.2.0'
    implementation 'androidx.media3:media3-exoplayer-hls:1.2.0'
    implementation 'androidx.media3:media3-ui:1.2.0'
    
    // WebView mejorado
    implementation 'androidx.webkit:webkit:1.9.0'
    
    // Networking
    implementation 'com.squareup.okhttp3:okhttp:4.12.0'
    
    // JSON
    implementation 'com.google.code.gson:gson:2.10.1'
    
    // Coroutines
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3'
}

En AndroidManifest.xml:
- Permisos: INTERNET, ACCESS_NETWORK_STATE, ACCESS_WIFI_STATE
- android:theme con fondo negro
- Orientación landscape para TV: android:screenOrientation="sensorLandscape"
- Fullscreen: android:windowSoftInputMode="adjustResize"
- Para TV Box: agregar intent-filter para LEANBACK_LAUNCHER
- Para móvil: intent-filter normal MAIN/LAUNCHER

Crear res/values/colors.xml:
<color name="bg_primary">#070c18</color>
<color name="accent_blue">#3b82f6</color>

Crear res/drawable/splash_bg.xml con fondo oscuro y logo

Crear SplashActivity.kt:
- Pantalla de splash 2 segundos
- Logo centrado (ícono de TV en azul)
- "IPTV DevByte" en texto blanco
- Luego lanza MainActivity
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PROMPT 3.2 — MainActivity con WebView
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
Crear MainActivity.kt y activity_main.xml:

activity_main.xml:
- FrameLayout raíz con fondo negro
- WebView que ocupa toda la pantalla (id: webView)
- PlayerView de ExoPlayer (id: playerView) encima del WebView, inicialmente GONE
- ProgressBar centrada (id: loadingBar) para el splash

MainActivity.kt:

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var playerView: PlayerView
    private var player: ExoPlayer? = null
    private val SERVER_URL = "http://TU_IP_SERVIDOR" // cambiar en build

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Fullscreen real
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        hideSystemUI()
        
        setContentView(R.layout.activity_main)
        
        webView = findViewById(R.id.webView)
        playerView = findViewById(R.id.playerView)
        
        setupWebView()
        setupExoPlayer()
        
        webView.loadUrl("$SERVER_URL/canales.html")
    }

    private fun setupWebView() {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
            mediaPlaybackRequiresUserGesture = false
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        }
        
        // Registrar la interface JS ↔ Android
        webView.addJavascriptInterface(AndroidBridge(this), "AndroidBridge")
        
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                // Notificar a JS que estamos en modo APK
                webView.evaluateJavascript(
                    "window.IS_ANDROID_APP = true; window.ANDROID_DEVICE_TYPE = '${getDeviceType()}';",
                    null
                )
            }
        }
    }

    private fun getDeviceType(): String {
        return if (isTV()) "TV_BOX" else "ANDROID_MOBILE"
    }

    private fun isTV(): Boolean {
        val uiModeManager = getSystemService(UI_MODE_SERVICE) as UiModeManager
        return uiModeManager.currentModeType == Configuration.UI_MODE_TYPE_TELEVISION
    }

    private fun hideSystemUI() {
        WindowInsetsControllerCompat(window, window.decorView).apply {
            hide(WindowInsetsCompat.Type.systemBars())
            systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) hideSystemUI()
    }
}
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PROMPT 3.3 — AndroidBridge: JS ↔ Android
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
Crear AndroidBridge.kt — la interfaz que permite al JS controlar la app nativa:

class AndroidBridge(private val activity: MainActivity) {

    // JS llama esto para reproducir un stream con ExoPlayer
    @JavascriptInterface
    fun playStream(streamUrl: String, streamUrlBackup: String, channelName: String, quality: String) {
        activity.runOnUiThread {
            activity.playWithExoPlayer(streamUrl, streamUrlBackup, channelName, quality)
        }
    }

    // JS llama esto para detener el video
    @JavascriptInterface
    fun stopStream() {
        activity.runOnUiThread {
            activity.stopExoPlayer()
        }
    }

    // JS llama esto para toggle play/pause
    @JavascriptInterface
    fun togglePlayPause() {
        activity.runOnUiThread {
            activity.toggleExoPlayer()
        }
    }

    // JS consulta el tipo de dispositivo
    @JavascriptInterface
    fun getDeviceType(): String {
        return activity.getDeviceType()
    }

    // JS consulta velocidad de red (más preciso que desde JS)
    @JavascriptInterface
    fun getNetworkSpeed(): String {
        val cm = activity.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val nc = cm.getNetworkCapabilities(cm.activeNetwork)
        val downMbps = (nc?.linkDownstreamBandwidthKbps ?: 0) / 1000
        return when {
            downMbps >= 15 -> "FHD"
            downMbps >= 5  -> "HD"
            else           -> "SD"
        }
    }

    // JS llama esto para mostrar/ocultar los controles nativos
    @JavascriptInterface
    fun setPlayerVisible(visible: Boolean) {
        activity.runOnUiThread {
            activity.playerView.visibility = if (visible) View.VISIBLE else View.GONE
        }
    }
}

En MainActivity.kt agregar las funciones de ExoPlayer:

fun playWithExoPlayer(streamUrl: String, backup: String, channelName: String, quality: String) {
    playerView.visibility = View.VISIBLE
    
    if (player == null) {
        player = ExoPlayer.Builder(this).build()
        playerView.player = player
    }
    
    val mediaItem = MediaItem.fromUri(Uri.parse(streamUrl))
    player!!.apply {
        setMediaItem(mediaItem)
        prepare()
        play()
        
        addListener(object : Player.Listener {
            override fun onPlayerError(error: PlaybackException) {
                // Intentar con backup
                if (backup.isNotEmpty()) {
                    setMediaItem(MediaItem.fromUri(Uri.parse(backup)))
                    prepare()
                    play()
                } else {
                    // Notificar al JS que falló
                    runOnUiThread {
                        webView.evaluateJavascript(
                            "window.onStreamError && window.onStreamError('${error.message}')",
                            null
                        )
                    }
                }
            }
        })
    }
}

fun stopExoPlayer() {
    player?.stop()
    playerView.visibility = View.GONE
}

fun toggleExoPlayer() {
    player?.let {
        if (it.isPlaying) it.pause() else it.play()
    }
}

En channels.js del frontend-tv, detectar si está en APK y usar AndroidBridge:

async function playVideo(streamData) {
  const { url, quality } = await selectStreamUrl(streamData)
  
  // Si está en APK Android → usar ExoPlayer nativo
  if (window.AndroidBridge) {
    window.AndroidBridge.playStream(
      url,
      streamData.streamUrlBackup || '',
      streamData.name,
      quality
    )
    return  // ExoPlayer maneja el video, no el <video> tag
  }
  
  // Si no → reproducción normal con HLS.js (navegador)
  playVideoInBrowser(url, streamData)
}
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PROMPT 3.4 — Control remoto nativo Android
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
Crear RemoteControlHandler.kt y conectar con el WebView:

En MainActivity.kt, sobreescribir dispatchKeyEvent:

override fun dispatchKeyEvent(event: KeyEvent): Boolean {
    if (event.action != KeyEvent.ACTION_DOWN) return super.dispatchKeyEvent(event)
    
    val jsAction = when (event.keyCode) {
        KeyEvent.KEYCODE_DPAD_UP       -> "up"
        KeyEvent.KEYCODE_DPAD_DOWN     -> "down"
        KeyEvent.KEYCODE_DPAD_LEFT     -> "left"
        KeyEvent.KEYCODE_DPAD_RIGHT    -> "right"
        KeyEvent.KEYCODE_DPAD_CENTER,
        KeyEvent.KEYCODE_ENTER         -> "enter"
        KeyEvent.KEYCODE_BACK          -> "back"
        KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE -> "playpause"
        KeyEvent.KEYCODE_MEDIA_PLAY    -> "play"
        KeyEvent.KEYCODE_MEDIA_PAUSE   -> "pause"
        KeyEvent.KEYCODE_0             -> "num0"
        KeyEvent.KEYCODE_1             -> "num1"
        KeyEvent.KEYCODE_2             -> "num2"
        KeyEvent.KEYCODE_3             -> "num3"
        KeyEvent.KEYCODE_4             -> "num4"
        KeyEvent.KEYCODE_5             -> "num5"
        KeyEvent.KEYCODE_6             -> "num6"
        KeyEvent.KEYCODE_7             -> "num7"
        KeyEvent.KEYCODE_8             -> "num8"
        KeyEvent.KEYCODE_9             -> "num9"
        // Botones de color del control
        KeyEvent.KEYCODE_PROG_RED      -> "red"
        KeyEvent.KEYCODE_PROG_GREEN    -> "green"
        KeyEvent.KEYCODE_PROG_YELLOW   -> "yellow"  // favoritos
        KeyEvent.KEYCODE_PROG_BLUE     -> "blue"
        else -> null
    }
    
    if (jsAction != null) {
        // Enviar el evento al JS del WebView
        webView.evaluateJavascript(
            "window.handleAndroidKey && window.handleAndroidKey('$jsAction')",
            null
        )
        return true  // consumir el evento, no propagarlo
    }
    
    return super.dispatchKeyEvent(event)
}

En channels.js, agregar la función que recibe los eventos del APK:

window.handleAndroidKey = function(action) {
  // Simular el mismo handleKeyDown pero con el action ya mapeado
  switch(action) {
    case 'up':       handleAction('up');       break
    case 'down':     handleAction('down');     break
    case 'left':     handleAction('left');     break
    case 'right':    handleAction('right');    break
    case 'enter':    handleAction('enter');    break
    case 'back':     handleAction('back');     break
    case 'playpause': togglePlayPause();       break
    case 'yellow':   toggleFavorite(filteredChannels[selectedIndex]?.id); break
    case 'num0': case 'num1': case 'num2': case 'num3': case 'num4':
    case 'num5': case 'num6': case 'num7': case 'num8': case 'num9':
      handleNumberInput(action.replace('num', ''))
      break
  }
}
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PROMPT 3.5 — Auto-actualización del APK
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
Implementar auto-actualización del APK:

BACKEND:
Agregar en .env:
APP_VERSION="1.0.0"
APK_DOWNLOAD_URL="http://TU_IP/downloads/iptv-devbyte.apk"

Crear endpoint GET /api/app/version:
Retorna: { version: "1.0.0", downloadUrl: "...", changelog: "..." }

En el servidor, crear carpeta /downloads/ accesible por Nginx:
location /downloads {
    root /home/TU_USUARIO/iptv-saas-devbyte;
    add_header Content-Disposition 'attachment; filename="iptv-devbyte.apk"';
}

ANDROID — UpdateChecker.kt:

class UpdateChecker(private val context: Context, private val currentVersion: String) {
    
    suspend fun checkForUpdate(): UpdateInfo? {
        return withContext(Dispatchers.IO) {
            try {
                val client = OkHttpClient()
                val request = Request.Builder()
                    .url("$SERVER_URL/api/app/version")
                    .build()
                val response = client.newCall(request).execute()
                val json = JSONObject(response.body?.string() ?: return@withContext null)
                val serverVersion = json.getString("version")
                
                if (isNewerVersion(serverVersion, currentVersion)) {
                    UpdateInfo(
                        version = serverVersion,
                        downloadUrl = json.getString("downloadUrl"),
                        changelog = json.optString("changelog", "Nueva versión disponible")
                    )
                } else null
            } catch (e: Exception) { null }
        }
    }
    
    private fun isNewerVersion(server: String, current: String): Boolean {
        // Comparar versiones semver simple
        val s = server.split(".").map { it.toIntOrNull() ?: 0 }
        val c = current.split(".").map { it.toIntOrNull() ?: 0 }
        for (i in 0..2) {
            if ((s.getOrNull(i) ?: 0) > (c.getOrNull(i) ?: 0)) return true
            if ((s.getOrNull(i) ?: 0) < (c.getOrNull(i) ?: 0)) return false
        }
        return false
    }
}

data class UpdateInfo(val version: String, val downloadUrl: String, val changelog: String)

En MainActivity.kt, al iniciar la app:
lifecycleScope.launch {
    val updater = UpdateChecker(this@MainActivity, BuildConfig.VERSION_NAME)
    val update = updater.checkForUpdate()
    if (update != null) {
        runOnUiThread {
            showUpdateDialog(update)
        }
    }
}

fun showUpdateDialog(update: UpdateInfo) {
    AlertDialog.Builder(this)
        .setTitle("Nueva versión disponible ${update.version}")
        .setMessage(update.changelog)
        .setPositiveButton("Actualizar ahora") { _, _ ->
            openBrowser(update.downloadUrl)
        }
        .setNegativeButton("Después") { dialog, _ -> dialog.dismiss() }
        .show()
}
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PROMPT 3.6 — Build y distribución del APK
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
Preparar el APK para distribución:

1. Cambiar SERVER_URL en el código por la IP real del servidor:
   En MainActivity.kt: private val SERVER_URL = "http://192.168.1.XXX"
   
   O mejor, usar BuildConfig para tener diferentes URLs por entorno:
   En app/build.gradle:
   buildTypes {
       debug {
           buildConfigField "String", "SERVER_URL", '"http://localhost:3001"'
       }
       release {
           buildConfigField "String", "SERVER_URL", '"http://192.168.1.XXX"'
           minifyEnabled false  // no ofuscar para WebView
       }
   }

2. Crear keystore para firmar el APK (solo una vez):
   En Android Studio: Build → Generate Signed Bundle/APK → APK
   Key store path: guardar en lugar seguro
   Guardar: keystore password, key alias, key password

3. Build del APK release:
   Build → Generate Signed Bundle/APK → APK → release
   El APK queda en: app/release/app-release.apk

4. Renombrar a iptv-devbyte-v1.0.0.apk

5. Copiar al servidor para descarga:
   scp iptv-devbyte-v1.0.0.apk usuario@192.168.1.XXX:~/iptv-saas-devbyte/downloads/

6. En el panel admin, agregar sección "Distribución APK":
   - Link de descarga: http://192.168.1.XXX/downloads/iptv-devbyte-v1.0.0.apk
   - Botón "Copiar link" 
   - QR code del link (para que el cliente escanee con el celular)
   - Instrucciones: "Activá 'Fuentes desconocidas' en Ajustes → Seguridad"
   - Versión actual publicada
   - Botón para subir nueva versión
   
7. Instrucciones para el cliente (card en el panel para copiar y enviar):
   "Para instalar IPTV DevByte en tu TV Box o celular Android:
   1. Abrí este link en tu dispositivo: [link]
   2. Si te pide permiso para instalar apps desconocidas, aceptá
   3. Instalá la app y abrila
   4. Pedime el código de acceso para activar tu cuenta"
```

---

## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PROMPT 3.7 — Verificación final Update 3
## ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
Verificar que el APK funciona correctamente:

1. Instalar en emulador de TV Box:
   - Crear AVD en Android Studio: TV → Android TV (1080p)
   - Instalar el APK debug
   - Verificar que carga el frontend TV
   - Navegar con las flechas del emulador (DPAD)
   - Reproducir un canal → debe usar ExoPlayer nativo
   
2. Instalar en celular Android físico:
   - Habilitar "Fuentes desconocidas" en Ajustes
   - Instalar APK
   - Verificar que el layout se adapta a móvil
   - Verificar favoritos, último canal, calidad adaptativa
   
3. Verificar control remoto físico (si tenés un TV Box):
   - Flechas navegan la lista
   - OK/Enter reproduce el canal
   - Back vuelve al menú o sale del modo cine
   - Números van al canal directo
   - Botón amarillo agrega a favoritos

4. Verificar auto-actualización:
   - Cambiar APP_VERSION en .env a "1.0.1"
   - Abrir la app con versión "1.0.0"
   - Debe aparecer el diálogo de actualización disponible
```

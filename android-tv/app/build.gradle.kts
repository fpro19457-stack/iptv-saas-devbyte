plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.devbyte.iptv"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.devbyte.iptv"
        minSdk = 21
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
        resourceConfigurations.add("en")
        buildConfigField("String", "SERVER_URL", "\"http://192.168.100.120:3000\"")
        buildConfigField("String", "API_URL", "\"http://192.168.100.120:3001\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            isDebuggable = true
        }
    }

    buildFeatures {
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }

    kotlinOptions {
        jvmTarget = "1.8"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("androidx.webkit:webkit:1.9.0")
    implementation("com.google.android.material:material:1.11.0")
}
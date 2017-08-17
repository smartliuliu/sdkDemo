package com.ble.demo;

import android.util.Log;

import com.example.test.mylibrary.Test;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;


/**
 * Created by 9am on 2017/8/14.
 */

public class BleNativeMoudle extends ReactContextBaseJavaModule {
    private final String TAG = "sdkDemo";
    public BleNativeMoudle(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "BleNativeMoudle";
    }

}
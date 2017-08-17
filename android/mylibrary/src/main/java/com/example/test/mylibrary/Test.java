package com.example.test.mylibrary;

import android.provider.Settings;
import android.support.annotation.Nullable;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

/**
 * Created by Administrator on 2016/10/30.
 */

public class Test {
    private final String TAG = "sdkDemo";

    //定义上下文对象
    public static ReactContext myContext;
    public static InterfaceCallback callback;

    //定义发送事件的函数
    public  void sendEvent(ReactContext reactContext, String eventName, Object params)
    {
        reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName,params);
    }


    public void connect(InterfaceCallback back){
        callback = back;
        sendEvent(myContext,"ble","connect");
    }

    public void connected(String message){
        callback.onEndcallback(message);
    }

    public void moveUp(){
        sendEvent(myContext,"ble","moveUp");
    }

}

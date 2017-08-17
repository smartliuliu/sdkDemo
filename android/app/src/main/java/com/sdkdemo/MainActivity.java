package com.sdkdemo;

import android.graphics.Color;
import android.os.Bundle;
import android.os.Debug;
import android.os.Handler;
import android.os.Message;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

import com.example.test.mylibrary.*;
import com.facebook.react.ReactActivity;


public class MainActivity extends BaseReactActivity {
    private final String TAG = "sdkDemo";
    private Handler mHandler ;
    private TextView text ;
    private Button btnUp;
    private Button btnDown;
    private Button btnStop;

    public static final int BLE_CONNECTED = 0x2001;
    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
//    @Override
//    protected String getMainComponentName() {
//        Log.d(TAG,"======== getMainComponentName() ========");
//        return "sdkDemo";
//    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        text = (TextView) findViewById(R.id.textView);
        btnUp = (Button)findViewById(R.id.btn_up);
        btnDown = (Button)findViewById(R.id.btn_down);
        btnStop = (Button)findViewById(R.id.btn_stop);
        text.setTextSize(20);
        text.setText("点击连接桌子");

        mHandler=new Handler(){
            @Override
            public void handleMessage(Message msg) {
                switch (msg.what){
                    case BLE_CONNECTED:
                        text.setText("连接成功");
                        text.setTextColor(Color.CYAN);
                        text.setTextSize(30);
                        btnUp.setVisibility(View.VISIBLE);
                        btnDown.setVisibility(View.VISIBLE);
                        btnStop.setVisibility(View.VISIBLE);
                        break;
                    default:
                        return;
                }
            }
        };

        text.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Log.d(TAG,"========= 点击了按钮 =======");
                new Test().connect(new InterfaceCallback(){
                    @Override
                    public void onEndcallback(String message) {
                        Message msg =Message.obtain();
                        msg.what= BLE_CONNECTED;
                        mHandler.sendMessage(msg);
                    }
                });
            }
        });

        btnUp.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {

            }
        });
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        Log.d(TAG,"======== onDestroy() ========");
    }

    @Override
    protected void onStop() {
        super.onStop();
        Debug.stopMethodTracing();
    }

}

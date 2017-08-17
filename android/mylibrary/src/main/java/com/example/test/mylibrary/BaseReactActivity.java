package com.example.test.mylibrary;

/**
 * Created by 9am on 2017/8/15.
 */

import android.annotation.TargetApi;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.Settings;
import android.support.v7.app.AppCompatActivity;
import android.text.TextUtils;
import android.util.Log;
import android.view.KeyEvent;
import android.widget.Toast;

import com.ble.demo.BleDemoPackage;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactInstanceManagerBuilder;
import com.facebook.react.ReactPackage;
import com.facebook.react.ReactRootView;
import com.facebook.react.common.LifecycleState;
import com.facebook.react.devsupport.DoubleTapReloadRecognizer;
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler;
import com.facebook.react.modules.core.PermissionAwareActivity;
import com.facebook.react.modules.core.PermissionListener;
import com.facebook.react.shell.MainReactPackage;
import java.io.File;

import javax.annotation.Nullable;

import it.innove.BleManagerPackage;

public abstract class BaseReactActivity extends AppCompatActivity implements DefaultHardwareBackBtnHandler, PermissionAwareActivity {

    private static final String TAG = "BaseReactActivity";
    private static final String REDBOX_PERMISSION_MESSAGE =
            "Overlay permissions needs to be granted in order for react native apps to run in dev mode";
    public static final String JS_MAIN_MODULE_NAME = "sdkDemo";
    public static final String JS_MAIN_BUNDLE_NAME = "index.android";
    public static final String JS_BUNDLE_LOCAL_FILE = "index.android.bundle";
    public static final String JS_BUNDLE_LOCAL_PATH = Environment.getExternalStorageDirectory().toString() + File.separator + JS_BUNDLE_LOCAL_FILE;

    private ReactInstanceManager mReactInstanceManager;
    private
    @Nullable
    PermissionListener mPermissionListener;
    private DoubleTapReloadRecognizer mDoubleTapReloadRecognizer;
    private ReactRootView mReactRootView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        mReactRootView = new ReactRootView(this);
        if (BuildConfig.DEBUG && Build.VERSION.SDK_INT >= 23) {
            // Get permission to show redbox in dev builds.
            if (!Settings.canDrawOverlays(this)) {
                Intent serviceIntent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
                startActivity(serviceIntent);
                Toast.makeText(this, REDBOX_PERMISSION_MESSAGE, Toast.LENGTH_LONG).show();
            }
        }
        iniReactRootView();
    }

    protected void iniReactRootView() {
        ReactInstanceManagerBuilder builder = ReactInstanceManager.builder()
                .setApplication(getApplication())
                .setJSMainModuleName(TextUtils.isEmpty(getMainModuleName()) ? JS_MAIN_BUNDLE_NAME : getMainModuleName())//bundle的名字
                .setUseDeveloperSupport(BuildConfig.DEBUG)//支持debug 摇一摇 reload页面
                .addPackage(new MainReactPackage())//添加RN提供的原生模块
                .setInitialLifecycleState(LifecycleState.BEFORE_CREATE);
        String jsBundleFile = getJSBundleFile();
        File file = null;
        if (!TextUtils.isEmpty(jsBundleFile)) {
            file = new File(jsBundleFile);
        }
        if (file != null && file.exists()) {
            builder.setJSBundleFile(getJSBundleFile());//从手机的本地加载文件
            Log.i(TAG, "============  load bundle from local cache");
        } else {
            String bundleAssetName = getBundleAssetName();
            builder.setBundleAssetName(TextUtils.isEmpty(bundleAssetName) ? JS_BUNDLE_LOCAL_FILE : bundleAssetName);//从assets文件下读取加载
            Log.i(TAG, "============= load bundle from asset");
        }
        Log.d(TAG,"========== getPackages() != null = "+(getPackages() != null));
        Log.d(TAG,"========== getBlePackages() != null = "+(getBlePackages() != null));
        Log.d(TAG,"========== getBleManagerPackger() != null = "+(getBleManagerPackger() != null));
        if (getPackages() != null) {
            builder.addPackage(getPackages());//添加自定义的通信模块
        }
        if(getBlePackages() != null){
            builder.addPackage(getBlePackages());
        }

        if(getBleManagerPackger() != null){
            builder.addPackage(getBleManagerPackger());
        }
        mReactInstanceManager = builder.build();
        mReactRootView.startReactApplication(mReactInstanceManager, getJsModuleName(), null);
        mDoubleTapReloadRecognizer = new DoubleTapReloadRecognizer();

    }

    protected String getJsModuleName(){
        return JS_MAIN_MODULE_NAME;
    };

    protected ReactPackage getPackages(){
        return new MyReactPackage();
    };

    protected ReactPackage getBlePackages(){
        return new BleDemoPackage();
    }

    protected ReactPackage getBleManagerPackger(){
        return new BleManagerPackage();
    }

    /**
     * 与modlue对应的js文件的名称
     *
     * @return
     */
    protected String getMainModuleName(){
        return JS_MAIN_BUNDLE_NAME;
    };

    /**
     * 从本地sd卡读取bundle文件
     *
     * @return
     */
    protected String getJSBundleFile(){
        return JS_BUNDLE_LOCAL_PATH;
    };

    /**
     * assets 中自带的 bundle名称
     *
     * @return
     */
     protected String getBundleAssetName(){
         return JS_BUNDLE_LOCAL_FILE;
     };

    @Override
    protected void onDestroy() {
        super.onDestroy();
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (mReactInstanceManager != null) {
            mReactInstanceManager.onHostPause();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (mReactInstanceManager != null) {
            mReactInstanceManager.onHostResume(this, new DefaultHardwareBackBtnHandler() {
                @Override
                public void invokeDefaultOnBackPressed() {
                    finish();
                }
            });
        }
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (mReactInstanceManager != null) {
            mReactInstanceManager.onActivityResult(BaseReactActivity.this, requestCode, resultCode, data);
        }
    }

    @Override
    public boolean onKeyUp(int keyCode, KeyEvent event) {
        if (mReactInstanceManager != null && BuildConfig.DEBUG) {
            if (keyCode == KeyEvent.KEYCODE_MENU) {
                mReactInstanceManager.showDevOptionsDialog();
                return true;
            }
            if (mDoubleTapReloadRecognizer.didDoubleTapR(keyCode, getCurrentFocus())) {
                mReactInstanceManager.getDevSupportManager().handleReloadJS();
            }
        }
        return super.onKeyUp(keyCode, event);
    }

    @Override
    public void onBackPressed() {
        if (mReactInstanceManager != null) {
            mReactInstanceManager.onBackPressed();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    public void invokeDefaultOnBackPressed() {
        super.onBackPressed();
    }

    @Override
    public void onNewIntent(Intent intent) {
        if (mReactInstanceManager != null) {
            mReactInstanceManager.onNewIntent(intent);
        } else {
            super.onNewIntent(intent);
        }
    }
    @TargetApi(23)
    @Override
    public void requestPermissions(String[] permissions, int requestCode, PermissionListener listener) {
        mPermissionListener = listener;
        this.requestPermissions(permissions, requestCode);
    }

    @Override
    public void onRequestPermissionsResult(
            int requestCode,
            String[] permissions,
            int[] grantResults) {
        if (mPermissionListener != null &&
                mPermissionListener.onRequestPermissionsResult(requestCode, permissions, grantResults)) {
            mPermissionListener = null;
        }
    }

}



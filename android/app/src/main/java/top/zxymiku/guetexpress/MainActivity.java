package top.zxymiku.guetexpress;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // 本地插件：自定义 scheme（androidamap:// 等）经系统 Intent 分发
        registerPlugin(top.zxymiku.guetexpress.plugins.AmapLauncherPlugin.class);
    }
}

package top.zxymiku.guetexpress.plugins;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * AmapLauncher — 用系统 Intent 打开任意 URL。
 *
 * 用途：
 * - androidamap://navi?...  直接唤起高德地图 App 进入导航
 * - https://uri.amap.com/... 兜底（网页版导航 / 引导下载）
 * - 其他 http(s) 链接（友链等）也可经系统浏览器打开
 *
 * 未安装目标应用时 startActivity 抛 ActivityNotFoundException，
 * JS 侧据此回退到 uri.amap.com 网页版。
 */
@CapacitorPlugin(name = "AmapLauncher")
public class AmapLauncherPlugin extends Plugin {

    @PluginMethod
    public void launch(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.isEmpty()) {
            call.reject("url is required");
            return;
        }
        Uri uri;
        try {
            uri = Uri.parse(url);
        } catch (Exception e) {
            call.reject("invalid url: " + e.getMessage());
            return;
        }
        // 仅放行 http/https 与应用自有 scheme，避免任意 intent 注入
        String scheme = uri.getScheme();
        boolean safeScheme = "http".equalsIgnoreCase(scheme)
                || "https".equalsIgnoreCase(scheme)
                || "androidamap".equalsIgnoreCase(scheme)
                || "amapuri".equalsIgnoreCase(scheme)
                || "iosamap".equalsIgnoreCase(scheme);
        if (!safeScheme) {
            call.reject("scheme not allowed: " + scheme);
            return;
        }
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, uri);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (ActivityNotFoundException e) {
            call.reject("no handler for scheme: " + scheme);
        }
    }
}

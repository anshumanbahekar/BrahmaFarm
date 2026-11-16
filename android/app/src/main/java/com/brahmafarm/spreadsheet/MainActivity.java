package com.brahmafarm.spreadsheet;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import androidx.webkit.WebViewAssetLoader;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/** Native Java shell for the shared offline BrahmaSpreadsheet application. */
public final class MainActivity extends Activity {
    private static final int PICK_CSV = 11;
    private static final int SAVE_FILE = 12;
    private static final String APP_HOST = "appassets.androidplatform.net";
    private WebView webView;
    private ValueCallback<Uri[]> fileCallback;
    private String pendingContent;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        webView = new WebView(this);
        webView.setLayoutParams(new ViewGroup.LayoutParams(-1,-1));
        setContentView(webView);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSafeBrowsingEnabled(true);
        webView.addJavascriptInterface(new NativeBridge(), "BrahmaNative");
        WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();
        webView.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("https".equals(uri.getScheme()) && APP_HOST.equals(uri.getHost())) return false;
                if ("https".equals(uri.getScheme()) || "http".equals(uri.getScheme())) {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                    return true;
                }
                return true;
            }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                Intent pick = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                pick.setType("*/*");
                pick.addCategory(Intent.CATEGORY_OPENABLE);
                pick.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"text/csv","text/plain","application/csv","application/json"});
                startActivityForResult(pick, PICK_CSV);
                return true;
            }
        });
        webView.loadUrl("https://" + APP_HOST + "/assets/index.html");
    }

    private final class NativeBridge {
        @JavascriptInterface public void saveFile(String content, String filename, String mime) {
            if (content == null || content.length() > 20_000_000) return;
            runOnUiThread(() -> {
                pendingContent = content;
                Intent save = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                boolean json = "application/json".equals(mime);
                save.setType(json ? "application/json" : "text/csv");
                save.addCategory(Intent.CATEGORY_OPENABLE);
                save.putExtra(Intent.EXTRA_TITLE, filename != null && filename.matches(json ? "[a-zA-Z0-9._-]+\\.json" : "[a-zA-Z0-9._-]+\\.csv") ? filename : (json ? "brahmafarm-backup.json" : "brahmafarm-records.csv"));
                startActivityForResult(save, SAVE_FILE);
            });
        }
    }

    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request,result,data);
        if (request == PICK_CSV) {
            if (fileCallback != null) fileCallback.onReceiveValue(result == RESULT_OK && data != null && data.getData() != null ? new Uri[]{data.getData()} : null);
            fileCallback = null;
        } else if (request == SAVE_FILE) {
            if (result == RESULT_OK && data != null && data.getData() != null && pendingContent != null) {
                try (OutputStream out = getContentResolver().openOutputStream(data.getData())) {
                    if (out == null) throw new IllegalStateException("No output stream");
                    out.write(pendingContent.getBytes(StandardCharsets.UTF_8));
                    Toast.makeText(this,"Backup saved",Toast.LENGTH_SHORT).show();
                } catch (Exception ex) { Toast.makeText(this,"Could not save backup",Toast.LENGTH_LONG).show(); }
            }
            pendingContent = null;
        }
    }

    @Override protected void onDestroy() {
        if (fileCallback != null) fileCallback.onReceiveValue(null);
        webView.destroy();
        super.onDestroy();
    }
}

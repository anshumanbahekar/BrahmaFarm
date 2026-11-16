using System.Diagnostics;
using System.IO;
using System.Text.Json;
using System.Windows;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.Wpf;
using Microsoft.Win32;

namespace BrahmaSpreadsheet;

public class Program : Application
{
    [STAThread]
    public static void Main()
    {
        var app = new Program();
        app.Run(new FarmWindow());
    }
}

public sealed class FarmWindow : Window
{
    private readonly WebView2 web = new();
    private const string Host = "brahma.local";

    public FarmWindow()
    {
        Title = "BrahmaSpreadsheet · BrahmaFarm";
        Width = 1360;
        Height = 850;
        MinWidth = 850;
        MinHeight = 570;
        WindowStartupLocation = WindowStartupLocation.CenterScreen;
        Content = web;
        Loaded += async (_, _) =>
        {
            await web.EnsureCoreWebView2Async();
            var dist = Path.Combine(AppContext.BaseDirectory, "dist");
            web.CoreWebView2.SetVirtualHostNameToFolderMapping(Host, dist, CoreWebView2HostResourceAccessKind.DenyCors);
            web.CoreWebView2.Settings.AreDevToolsEnabled = false;
            web.CoreWebView2.Settings.AreDefaultContextMenusEnabled = true;
            web.CoreWebView2.WebMessageReceived += OnMessage;
            web.CoreWebView2.NewWindowRequested += (_, e) =>
            {
                e.Handled = true;
                if (Uri.TryCreate(e.Uri, UriKind.Absolute, out var uri) && (uri.Scheme == "https" || uri.Scheme == "http"))
                    Process.Start(new ProcessStartInfo(uri.ToString()) { UseShellExecute = true });
            };
            web.CoreWebView2.NavigationStarting += (_, e) =>
            {
                if (Uri.TryCreate(e.Uri, UriKind.Absolute, out var uri) && uri.Host != Host)
                {
                    e.Cancel = true;
                    if (uri.Scheme == "https" || uri.Scheme == "http")
                        Process.Start(new ProcessStartInfo(uri.ToString()) { UseShellExecute = true });
                }
            };
            web.Source = new Uri($"https://{Host}/index.html");
        };
    }

    private void OnMessage(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
    {
        try
        {
            using var document = JsonDocument.Parse(e.WebMessageAsJson);
            var root = document.RootElement;
            if (!root.TryGetProperty("action", out var action) || action.GetString() != "saveFile") return;
            var content = root.GetProperty("content").GetString();
            var suggested = root.GetProperty("filename").GetString();
            var json = root.TryGetProperty("mime", out var mime) && mime.GetString() == "application/json";
            if (content == null || content.Length > 20_000_000) return;
            var dialog = new SaveFileDialog
            {
                FileName = suggested != null && System.Text.RegularExpressions.Regex.IsMatch(suggested, json ? @"^[a-zA-Z0-9._-]+\.json$" : @"^[a-zA-Z0-9._-]+\.csv$") ? suggested : (json ? "brahmafarm-backup.json" : "brahmafarm-records.csv"),
                Filter = json ? "BrahmaFarm backup (*.json)|*.json" : "CSV file (*.csv)|*.csv",
                DefaultExt = json ? ".json" : ".csv"
            };
            if (dialog.ShowDialog(this) == true) File.WriteAllText(dialog.FileName, content, new System.Text.UTF8Encoding(false));
        }
        catch (Exception ex)
        {
            MessageBox.Show(this, $"Could not export backup: {ex.Message}", "BrahmaSpreadsheet", MessageBoxButton.OK, MessageBoxImage.Warning);
        }
    }
}

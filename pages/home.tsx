import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, Download, Loader2, LucideIcon, Monitor, Moon, Sun } from "lucide-react";
import { type Browser } from 'wxt/browser';
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Settings } from "@/types/settings";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const downloadFormSchema = z.object({
    url: z.string().min(1, { message: "URL is required" }).url({message: "Invalid URL format." }),
});

export default function HomePage() {
    const { setTheme } = useTheme();
    const [isDownloading, setIsDownloading] = useState(false);
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);
    const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
    const [showNotRunningAlert, setShowNotRunningAlert] = useState(false);
    const [settings, setSettings] = useState<Settings>({
        theme: "system",
        autofill_url: true,
    });

    const themeOptions: { value: 'system' | 'dark' | 'light'; icon: LucideIcon; label: string }[] = [
        { value: 'light', icon: Sun, label: 'Light' },
        { value: 'dark', icon: Moon, label: 'Dark' },
        { value: 'system', icon: Monitor, label: 'System' },
    ];

    const downloadForm = useForm<z.infer<typeof downloadFormSchema>>({
        resolver: zodResolver(downloadFormSchema),
        defaultValues: {
          url: '',
        },
        mode: "onChange",
    });
    const watchedUrl = downloadForm.watch("url");

    const handleDownload = async (url?: string) => {
        setIsDownloading(true);
        setShowNotRunningAlert(false); // Reset alert status at the beginning
        
        // Create a timeout reference with undefined type
        let timeoutId: NodeJS.Timeout | undefined;
        
        try {
            const tabs = await new Promise<Browser.tabs.Tab[]>(resolve => {
                browser.tabs.query({active: true, currentWindow: true}, resolve);
            });
            
            const activeTab = tabs[0];
            
            // Create a race between the actual message and a timeout
            const response = await Promise.race([
                browser.runtime.sendMessage({
                    action: 'download',
                    url: url ?? activeTab.url
                }),
                new Promise((_, reject) => {
                    timeoutId = setTimeout(() => {
                        reject(new Error('TIMEOUT'));
                    }, 5000); // 5 second timeout
                })
            ]);
            
            // If we reach here, the request completed successfully
            if (timeoutId) clearTimeout(timeoutId);
            
            if (response) {
                console.log('Response from background script:', response);
            }
        } catch (error) {
            console.error("Download failed", error);
            
            // Check if this was a timeout error
            if (error instanceof Error && error.message === 'TIMEOUT') {
                setShowNotRunningAlert(true);
            }
            
            // Clear the timeout if it was some other error
            if (timeoutId) clearTimeout(timeoutId);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDownloadSubmit = async (values: z.infer<typeof downloadFormSchema>) => {
        await handleDownload(values.url);
    }

    const saveSettings = async <K extends keyof Settings>(key: K, value: Settings[K]) => {
        setIsUpdatingSettings(true);
        try {
            // First, get current settings from storage
            const result = await browser.storage.local.get('settings');
            const currentSettings = result.settings || {};
            
            // Update with new value
            const updatedSettings = {
                ...currentSettings,
                [key]: value
            };
            
            // Save to storage
            await browser.storage.local.set({ settings: updatedSettings });
            
            // Update state if save was successful
            setSettings(prevSettings => ({
                ...prevSettings,
                [key]: value
            }));
            
            console.log(`Settings ${key} updated to:`, value);
        } catch (error) {
            console.error(`Failed to save settings ${key}:`, error);
        } finally {
            setIsUpdatingSettings(false);
        }
    };

    // loading the settings from storage if available, overwriting the default values when the component mounts
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const result = await browser.storage.local.get('settings');
                if (result.settings) {
                    // Merge saved settings with default settings
                    // Only override keys that exist in saved settings, keeping defaults otherwise
                    setSettings(prevSettings => ({
                        ...prevSettings,
                        ...result.settings
                    }));
                }
            } catch (error) {
                console.error("Failed to load settings:", error);
            } finally {
                setIsLoadingSettings(false);
            }
        };
        loadSettings();
    }, []);

    // Auto-fill the URL field with the active tab's URL when the component mounts (if autofill is enabled)
    useEffect(() => {
        console.log({isLoadingSettings, settings});
        const autoFillUrl = async () => {
            const tabs = await new Promise<Browser.tabs.Tab[]>(resolve => {
                browser.tabs.query({active: true, currentWindow: true}, resolve);
            });
            const activeTab = tabs[0];
            if (activeTab && activeTab.url) {
                downloadForm.setValue("url", activeTab.url);
                await downloadForm.trigger("url");
            }
        }
        if (!isLoadingSettings && settings.autofill_url) {
            autoFillUrl();
        }
    }, [isLoadingSettings, settings.autofill_url]);

    // Listen for tab URL changes and update the form value accordingly (if autofill is enabled)
    useEffect(() => {
        if (isLoadingSettings || !settings.autofill_url) return;
        const handleTabUrlChange = async (tabId: number, changeInfo: Browser.tabs.TabChangeInfo) => {
            if (changeInfo.status === "complete") {
                browser.tabs.get(tabId).then(async (tab) => {
                    if (tab.active && tab.url) {
                        downloadForm.setValue("url", tab.url);
                        await downloadForm.trigger("url");
                    }
                });
            }
        }
        browser.tabs.onUpdated.addListener(handleTabUrlChange);
        return () => {
            browser.tabs.onUpdated.removeListener(handleTabUrlChange);
        }
    }, [isLoadingSettings, settings.autofill_url]);

    // Update the theme when settings change
    useEffect(() => {
        const updateTheme = async () => {
            setTheme(settings.theme);
        }
        updateTheme().catch(console.error);
    }, [settings.theme]);

    return (
        <div className="content flex flex-col space-y-4 w-full">
            <div className="theme-selection flex items-center justify-center">
                <div className={cn('inline-flex gap-1 rounded-lg p-1 bg-muted')}>
                    {themeOptions.map(({ value, icon: Icon, label }) => (
                        <button
                            key={value}
                            onClick={() => saveSettings('theme', value)}
                            className={cn(
                                'flex items-center rounded-md px-[0.80rem] py-1.5 transition-colors',
                                settings.theme === value
                                    ? 'bg-white shadow-xs dark:bg-neutral-700 dark:text-neutral-100'
                                    : 'text-neutral-500 hover:bg-neutral-200/60 hover:text-black dark:text-neutral-400 dark:hover:bg-neutral-700/60',
                            )}
                        >
                            <Icon className="-ml-1 h-4 w-4" />
                            <span className="ml-1.5 text-xs">{label}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div className="autofill-url flex items-center justify-center gap-4">
                <Switch
                id="autofill-url"
                checked={settings.autofill_url}
                onCheckedChange={(checked) => saveSettings("autofill_url", checked)}
                />
                <Label htmlFor="autofill-url">AutoFill Page URL</Label>
            </div>
            <Form {...downloadForm}>
                <form onSubmit={downloadForm.handleSubmit(handleDownloadSubmit)} className="flex flex-col gap-4 w-full" autoComplete="off">
                    <FormField
                        control={downloadForm.control}
                        name="url"
                        disabled={isDownloading || isLoadingSettings || isUpdatingSettings}
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormControl>
                                    <Textarea
                                        className="w-full h-28 resize-none text-sm"
                                        placeholder="Enter URL"
                                        {...field}
                                        readOnly={settings.autofill_url}
                                    />
                                </FormControl>
                                <FormMessage />
                                {showNotRunningAlert && (
                                    <Alert variant="destructive" className="mt-2">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Host Error</AlertTitle>
                                        <AlertDescription className="text-xs">
                                            Make sure NeoDLP is Installed and Running
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </FormItem>
                        )}
                    />
                    <Button className="w-full cursor-pointer" type="submit" disabled={isDownloading || isLoadingSettings || isUpdatingSettings || !watchedUrl || downloadForm.getFieldState("url").invalid}>
                        {isDownloading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Starting
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" />
                                Download
                            </>
                        )}
                    </Button>
                </form>
            </Form>
        </div>
    )
}
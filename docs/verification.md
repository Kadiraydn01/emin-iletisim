# Doğrulama kaydı — 23 Kasım 2026

İçerik yönetimi akışı: mobil tarayıcı formu → korumalı POST → SQLite → ziyaretçiye sunucuda üretilmiş HTML.

| Kontrol | Sonuç |
| --- | --- |
| SSR build | 16 sayfa, her sayfada tek H1 ve meta açıklaması |
| İç bağlantı kontrolü | 230 iç bağlantı başarılı |
| Entegrasyon testleri | 15/15 başarılı |
| Giriş/çıkış, parola değişimi, oturum iptali | HTTP testleri başarılı |
| CSRF, yanlış origin, giriş limiti | Sırasıyla 403/403/429 doğrulandı |
| Taslak ve zamanlı yayın izolasyonu | Yayın öncesi 404, sitemap dışında |
| URL değişimi | Eski adres 301; zincirler doğrudan yeni hedefe güncellenir |
| Görsel yükleme | Decode + WebP yeniden kodlama, iki boyut; SVG reddedildi |
| Yedek | SQLite integrity_check: ok; görsel dosyası mevcut |
| CLI yönetici oluşturma | Ayrı test veritabanında gizli giriş/tekrar başarılı |
| Mobil tarayıcı | 390px viewport, içerik eni 375px, scrollWidth 375px; taşma yok |
| Mobil kullanıcı akışı | Menü açma ve hizmet sayfasına geçiş başarılı |
| Mobil yönetim akışı | Test blogu + SSS oluşturma, kaydetme, önizleme, yayınlama ve sonuç sayfası başarılı |
| Tarayıcı konsolu | Kontrol edilen akışlarda hata yok |
| Paket güvenliği | sharp 0.35.5 kurulum denetimi: 0 açık |

Yerel tek HTTP ölçümü: ana sayfa HTML 10.700 byte, cevap ve gövde okuma 46ms. Ziyaretçi JS 671 byte, CSS yaklaşık 10,6KB. Bunlar Lighthouse veya gerçek kullanıcı Core Web Vitals ölçümü değildir. Lighthouse, harici Schema/Rich Results aracı, Search Console/Bing mülk doğrulaması ve gerçek alan adında indeksleme ölçümü yapılmadı.

Tarayıcıda kullanılan test hesabı ve içerik `test-results/ui-data` içinde izole edildi; gerçek `data/site.sqlite` veritabanında yönetici hesabı oluşturulmadı. Kullanıcı kendi hesabını `npm run admin:create` ile oluşturur.

## Canlı yayın doğrulaması

23 Kasım 2026: Vercel READY; Neon ve Blob kalıcılığı; canlı HTTPS adresinde 16 sayfa, yönetici login/ekranlar, taslak oluşturma-düzenleme, CSRF, gerçek görsel yükleme/okuma ve logout başarılı. Test kayıtları temizlendi. Canonical ve sitemap emin-iletisim.vercel.app üzerinde; global indeksleme açık. Ayrıntı: deployment.md.

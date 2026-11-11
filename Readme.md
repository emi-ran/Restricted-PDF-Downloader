# Restricted PDF Downloader

Bu proje, Google Drive'da bulunan kısıtlı PDF belgelerini direkt olarak indirilebilir PDF formatına dönüştüren bir Chrome uzantısıdır.

## Özellikler

- **Tekli İndirme:** Aktif sekmede açık olan PDF belgesini anında indir
- **Toplu İndirme:** Tüm açık Google Drive PDF sekmelerini tek seferde ZIP olarak indir
- **Classroom Entegrasyonu:** Google Classroom sınıf çalışmaları sayfasındaki tüm materyalleri tek tıkla aç
- Otomatik kaydırma ile tüm sayfaları yakalama
- Modern ve kullanıcı dostu arayüz
- Gerçek zamanlı ilerleme göstergesi

## Gereksinimler

- Google Chrome tarayıcısı
- Chrome uzantıları için gerekli izinler

## Kurulum

1. Projeyi [GitHub'dan](https://github.com/emi-ran/Restricted-PDF-Downloader) indirin veya klonlayın.
2. Chrome tarayıcınızda `chrome://extensions/` adresine gidin.
3. Sağ üst köşedeki **"Geliştirici Modu"** seçeneğini aktif edin.
4. **"Paketlenmemiş uzantıyı yükle"** butonuna tıklayarak proje dizinini seçin.

Yayın sayfasındaki `restricted-pdf-downloader.zip` dosyası da indirilebilir; ZIP'i çıkarıp oluşan klasörü paketlenmemiş uzantı olarak yükleyin.

## CI ve sürüm yayınlama

GitHub Actions her push ve pull request'te JavaScript sözdizimini, manifesti ve paket dosyalarını kontrol eder. `v1.6` gibi bir `v` etiketi gönderildiğinde, etiket `manifest.json` içindeki sürümle tam olarak eşleşmeli; kontroller geçerse GitHub otomatik sürüm notlarıyla bir release oluşturur ve yüklenebilir ZIP'i ekler. Sürüm notları commit ve pull request geçmişinden üretilir; gerektiğinde GitHub'da düzenlenebilir.

Yayın için önce sürümü ve değişiklikleri commit'leyip gönderin, ardından eşleşen etiketi oluşturup gönderin. Etiketi göndermek release'i otomatik yayınlar; etiketin yeniden kullanılması mevcut release'i güncellemez.

## Kullanım

### Tekli İndirme

1. Google Drive üzerinde bir PDF belgesi açın.
2. Uzantı ikonuna tıklayın.
3. **"Bu Sayfayı İndir"** butonuna basın.
4. Sayfa otomatik olarak taranacak ve PDF dosyanız indirilecektir.

### Toplu İndirme

Birden fazla PDF'i aynı anda indirmek için:

1. İndirmek istediğiniz tüm Google Drive PDF belgelerini **farklı sekmelerde** açın.
2. Uzantı ikonuna tıklayın.
3. Birden fazla PDF sekmesi açıksa **"Toplu İndir"** butonu görünecektir.
4. Butona tıklayarak toplu indirme penceresini açın.
5. **"İşlemi Başlat"** butonuna basın.
6. Uzantı sırayla her sekmeyi ziyaret edecek, PDF'leri oluşturacak ve tamamlandığında hepsini tek bir **ZIP dosyası** olarak indirecektir.

> ⚠️ **Önemli:** Toplu indirme sırasında açılan pencereyi kapatmayın ve sekmelere müdahale etmeyin.

### Classroom PDF eklerini ZIP olarak indirme

1. Classroom'da bir materyalin ayrıntı sayfasını açın.
2. Uzantıdan **PDF eklerini ZIP indir** seçeneğini, ardından **İşlemi Başlat** düğmesini seçin.
3. İşlem penceresini ve Classroom sayfasını açık tutun. Uzantı PDF eklerini **Classroom PDF** adlı geçici bir sekme grubunda açıp sırayla işler ve tek ZIP olarak kaydeder. İşlenen sekmeler kapanır; son sekmeyle grup da kaybolur. Başarısız dosyalar işlem penceresinde belirtilir; ZIP eksik olabilir.

Yalnızca sayfada PDF olarak görünen Drive ekleri işlenir. PDF'ler görüntülenen sayfalardan yeniden oluşturulur; orijinal metin ve kalite korunmayabilir. Yalnızca indirme ve kullanım izniniz olan dosyaları işleyin.

### Classroom Materyallerini Açma

Google Classroom'daki tüm ders materyallerini tek seferde açmak için:

1. Google Classroom'da bir dersin **Sınıf Çalışmaları** sayfasını açın (URL'de `/w/` olan sayfa).
2. Uzantı ikonuna tıklayın.
3. **"Tüm Materyalleri Aç"** butonu görünecektir (yanında materyal sayısı).
4. Butona tıkladığınızda tüm materyaller otomatik olarak genişletilecek ve Drive linkleri yeni sekmelerde açılacaktır.

> 💡 **İpucu:** Materyaller açıldıktan sonra **"Toplu İndir"** butonuyla hepsini tek ZIP olarak indirebilirsiniz.

## Nasıl Çalışır?

Uzantı aşağıdaki adımları gerçekleştirir:

1. PDF sayfalarını görüntü olarak yakalar (otomatik kaydırma ile)
2. Görüntüleri işler ve kalitesini optimize eder
3. Tüm sayfaları tek bir PDF dosyasında birleştirir
4. **Tekli indirmede:** PDF'i doğrudan indirir
5. **Toplu indirmede:** Tüm PDF'leri bir ZIP arşivine paketleyip indirir

## Önemli Notlar

- Bu uygulama yalnızca eğitim amaçlıdır. Google Drive'daki içeriklerin indirilmesi veya kullanılmasıyla ilgili herhangi bir yasal sorumluluk kabul edilmez.
- Lütfen sadece kendi dosyalarınızı indirin veya sahibinin izniyle içeriği kullanın.
- Uzantı yalnızca Google Drive üzerinde görüntülenen PDF dosyalarını işleyebilir.

## Sürüm Geçmişi

### v1.6

- Classroom materyal ayrıntılarındaki PDF eklerini tek ZIP olarak indirme.
- Eksik sayfa veya işlenemeyen dosyaları bildirme ve aynı adlı dosyaları koruma.

### v1.5

- Google Classroom entegrasyonu eklendi
- Sınıf çalışmaları sayfasından tüm materyalleri tek tıkla açma özelliği

### v1.4

- Modern UI/UX iyileştirmeleri
- Hata mesajları için blur backdrop efekti
- Toast bildirimleri güncellendi

## İletişim

Herhangi bir sorun veya öneri için benimle iletişime geçebilirsiniz. Geri bildirimlerinizi bekliyorum!

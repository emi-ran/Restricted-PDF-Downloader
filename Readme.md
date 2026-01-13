# Restricted PDF Downloader

Bu proje, Google Drive'da bulunan kısıtlı PDF belgelerini direkt olarak indirilebilir PDF formatına dönüştüren bir Chrome uzantısıdır.

## Özellikler

- **Tekli İndirme:** Aktif sekmede açık olan PDF belgesini anında indir
- **Toplu İndirme:** Tüm açık Google Drive PDF sekmelerini tek seferde ZIP olarak indir
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

## İletişim

Herhangi bir sorun veya öneri için benimle iletişime geçebilirsiniz. Geri bildirimlerinizi bekliyorum!

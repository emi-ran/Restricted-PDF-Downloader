# Restricted PDF Downloader

Bu proje, Google Drive'da bulunan PDF belgelerinden görüntüleri alıp bir .tpdf dosyasına dönüştüren bir Chrome uzantısıdır.

## Özellikler

- Google Drive üzerinde açılan PDF belgelerinden görüntüleri otomatik olarak alma.
- Görüntüleri Base64 formatında birleştirip .tpdf dosyası olarak indirme.
- Kullanıcı dostu bir arayüz ile basit ve hızlı kullanım.

## Gereksinimler

- Google Chrome tarayıcısı
- Chrome uzantıları için gerekli izinler

## Kullanım

1. **Uzantıyı Yükleme**:

   - Projeyi [GitHub'dan](https://github.com/emi-ran/Restricted-PDF-Downloader) indirin.
   - Chrome tarayıcınızda `chrome://extensions/` adresine gidin.
   - Sağ üst köşedeki "Geliştirici Modu" seçeneğini aktif edin.
   - "Paketlenmemiş uzantıyı yükle" butonuna tıklayarak proje dizinini seçin.

2. **PDF Belgesini Açma**:

   - Google Drive üzerinde bir PDF belgesi açın. URL’nin `https://drive.google.com` ile başladığından ve `/view` ile bittiğinden emin olun.

3. **Dönüştürme İşlemi**:

   - Uzantı ikonuna tıklayın ve "PDFData'ya Dönüştür ve İndir" butonuna basın.
   - Uygulama, PDF belgesini otomatik olarak kaydıracak ve görüntüleri toplayacaktır.

4. **İndirme**:
   - İşlem tamamlandığında, .tpdf dosyası otomatik olarak indirilecektir.

## Önemli Notlar

- Bu uygulama yalnızca eğitim amaçlıdır. Google Drive'daki içeriklerin indirilmesi veya kullanılmasıyla ilgili herhangi bir yasal sorumluluk kabul edilmez.
- Lütfen sadece kendi dosyalarınızı indirin veya sahibinin izniyle içeriği kullanın.
- .tpdf dosyasını .pdf dosyasına çevirmek için [BURADAKİ](https://github.com/emi-ran/tpdf-to-pdf/releases/tag/tpdfconverter) projemde oluşturduğum dönüştürücüyü indirebilirsiniz. Ek olarak bu uygulamayı eklenti üzerinde bulunan `Pdf Converter'ı indirmek için tıklayınız` yazısına tıklayarak da indirebilirsiniz.

## İletişim

Herhangi bir sorun veya öneri için benimle iletişime geçebilirsiniz. Geri bildirimlerinizi bekliyorum!

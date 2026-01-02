<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// require 'PHPMailer/src/PHPMailer.php'; // Jeśli wgrałeś ręcznie
// require 'PHPMailer/src/SMTP.php';
// require 'PHPMailer/src/Exception.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $mail = new PHPMailer(true);

    try {
        // KONFIGURACJA SMTP
        $mail->isSMTP();
        $mail->Host = 'smtp.home.pl'; // Serwer SMTP Home.pl
        $mail->SMTPAuth = true;
        $mail->Username = 'serwer2500890.home.pl  '; // ❗Podaj swój adres e-mail
        $mail->Password = 'YamahaTracer900YamahaFjr1300!'; // ❗Podaj hasło do skrzynki e-mail
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS; // Użyj TLS (lub SSL dla portu 465)
        $mail->Port = 465; // Port SMTP

        // NADAWCA I ODBIORCA
        $mail->setFrom('mobilnypomocnik@mobilnyit.pl', 'Mobilny Informatyk'); 
        $mail->addAddress('mobilnypomocnik@gmail.com'); // ❗Podaj adres docelowy

        // TREŚĆ WIADOMOŚCI
        $mail->isHTML(true);
        $mail->Subject = 'Nowa rezerwacja wizyty';
        $mail->Body = "
            <h2>Nowa rezerwacja</h2>
            <p><strong>Imię i nazwisko:</strong> {$_POST["bb-name"]}</p>
            <p><strong>Numer telefonu:</strong> {$_POST["bb-phone"]}</p>
            <p><strong>Data:</strong> {$_POST["bb-date"]}</p>
            <p><strong>Godzina:</strong> {$_POST["bb-time"]}</p>
            <p><strong>Wiadomość:</strong> {$_POST["bb-message"]}</p>
        ";

        // WYSŁANIE WIADOMOŚCI
        $mail->send();
        echo "✅ Wiadomość wysłana pomyślnie!";
    } catch (Exception $e) {
        echo "❌ Wystąpił błąd: {$mail->ErrorInfo}";
    }
}
?>

"use strict";
// services/emailService.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendBookingConfirmationEmail = exports.sendPasswordResetEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
// Configure mail transporter
const transporter = nodemailer_1.default.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});
// Enhanced password reset template
const sendPasswordResetEmail = (to, token, firstName) => __awaiter(void 0, void 0, void 0, function* () {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const mailOptions = {
        from: `"SunsetView.com" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Reset your password',
        html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
          
          body {
            font-family: 'Poppins', Arial, sans-serif;
            margin: 0;
            padding: 0;
            line-height: 1.6;
            color: #333333;
            background-color: #f8f8f8;
          }
          
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
          }
          
          .email-header {
            background: linear-gradient(135deg, #f97316, #f59e0b);
            padding: 30px;
            text-align: center;
          }
          
          .email-header h1 {
            color: white;
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            letter-spacing: 0.5px;
          }
          
          .email-body {
            padding: 40px 30px;
          }
          
          h2 {
            color: #333333;
            font-size: 24px;
            margin-top: 0;
            margin-bottom: 20px;
          }
          
          p {
            margin-bottom: 20px;
            color: #555555;
          }
          
          .button-container {
            text-align: center;
            margin: 35px 0;
          }
          
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #f97316, #f59e0b);
            color: white;
            text-decoration: none;
            padding: 14px 30px;
            border-radius: 50px;
            font-weight: 600;
            font-size: 16px;
            transition: transform 0.3s ease;
            box-shadow: 0 4px 8px rgba(249, 115, 22, 0.2);
          }
          
          .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(249, 115, 22, 0.25);
          }
          
          .reset-url {
            padding: 15px;
            background-color: #f8f8f8;
            border-radius: 8px;
            word-break: break-all;
            font-size: 14px;
            color: #666666;
            margin-top: 30px;
          }
          
          .expiry-notice {
            font-size: 14px;
            color: #e63946;
            margin: 15px 0;
          }
          
          .email-footer {
            text-align: center;
            padding: 20px;
            background-color: #f8f8f8;
            color: #888888;
            font-size: 12px;
            border-top: 1px solid #eeeeee;
          }
          
          @media only screen and (max-width: 480px) {
            .email-body {
              padding: 25px 15px;
            }
            
            .email-header h1 {
              font-size: 24px;
            }
            
            h2 {
              font-size: 20px;
            }
            
            .button {
              padding: 12px 25px;
              font-size: 14px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <h1>SunsetView.com</h1>
          </div>
          <div class="email-body">
            <h2>Hello ${firstName},</h2>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            
            <div class="button-container">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <p>If you did not request a password reset, you can safely ignore this email.</p>
            
            <p class="expiry-notice">This link will expire in 1 hour.</p>
            
            <p>If the button doesn't work, copy and paste this URL into your browser:</p>
            <div class="reset-url">${resetUrl}</div>
            
            <p>Best regards,<br>The SunsetView.com Team</p>
          </div>
          <div class="email-footer">
            <p>&copy; ${new Date().getFullYear()} SunsetView.com. All rights reserved.</p>
            <p>This is an automated email, please do not reply to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `
    };
    return transporter.sendMail(mailOptions);
});
exports.sendPasswordResetEmail = sendPasswordResetEmail;
// Enhanced booking confirmation email
const sendBookingConfirmationEmail = (booking, hotel) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(`Starting email sending process for booking: ${booking._id}`);
        // Format dates for display
        const checkInDate = new Date(booking.checkIn);
        const checkOutDate = new Date(booking.checkOut);
        // Calculate the number of nights
        const nightsStayed = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
        // Format dates in a more user-friendly way
        const formatDate = (date) => {
            const options = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            };
            return date.toLocaleDateString('en-US', options);
        };
        // Calculate price breakdown
        const adultCost = hotel.pricePerNight * booking.adultCount * nightsStayed;
        const childrenCost = (hotel.pricePerNight / 2) * booking.childrenCount * nightsStayed;
        const totalCost = booking.bookingTotalCost;
        const mailOptions = {
            from: `"SunsetView.com" <${process.env.EMAIL_USER}>`,
            to: booking.email,
            subject: `Booking Confirmation - ${hotel.name}`,
            html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Booking Confirmation</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
            
            body {
              font-family: 'Poppins', Arial, sans-serif;
              margin: 0;
              padding: 0;
              line-height: 1.6;
              color: #333333;
              background-color: #f8f8f8;
            }
            
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
            }
            
            .email-header {
              background: linear-gradient(135deg, #f97316, #f59e0b);
              padding: 30px;
              text-align: center;
            }
            
            .email-header h1 {
              color: white;
              margin: 0;
              font-size: 28px;
              font-weight: 700;
              letter-spacing: 0.5px;
            }
            
            .email-body {
              padding: 40px 30px;
            }
            
            h2 {
              color: #333333;
              font-size: 24px;
              margin-top: 0;
              margin-bottom: 20px;
            }
            
            h3 {
              color: #555555;
              font-size: 18px;
              margin-top: 0;
              margin-bottom: 15px;
            }
            
            p {
              margin-bottom: 15px;
              color: #555555;
            }
            
            .card {
              background-color: #f9f9f9;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 25px;
              border-left: 4px solid #f97316;
            }
            
            .payment-card {
              background-color: #e8f5e9;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 25px;
              border-left: 4px solid #4caf50;
            }
            
            .payment-card h3 {
              color: #2e7d32;
            }
            
            .info-card {
              background-color: #e3f2fd;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 25px;
              border-left: 4px solid #2196f3;
            }
            
            .info-card h3 {
              color: #1565c0;
            }
            
            .booking-details {
              margin-bottom: 10px;
            }
            
            .booking-details strong {
              color: #333333;
              font-weight: 600;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
            }
            
            table td {
              padding: 8px 0;
              color: #555555;
            }
            
            table td:last-child {
              text-align: right;
              font-weight: 500;
            }
            
            .total-row {
              border-top: 1px solid #dddddd;
              font-weight: 600;
              color: #333333;
            }
            
            .total-row td {
              padding-top: 12px;
            }
            
            .paid-text {
              color: #2e7d32;
              font-weight: 600;
              font-size: 18px;
              text-align: center;
              margin-top: 10px;
            }
            
            .email-footer {
              text-align: center;
              padding: 20px;
              background-color: #f8f8f8;
              color: #888888;
              font-size: 12px;
              border-top: 1px solid #eeeeee;
            }
            
            @media only screen and (max-width: 480px) {
              .email-body {
                padding: 25px 15px;
              }
              
              .email-header h1 {
                font-size: 24px;
              }
              
              h2 {
                font-size: 20px;
              }
              
              h3 {
                font-size: 16px;
              }
              
              .card, .payment-card, .info-card {
                padding: 15px;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="email-header">
              <h1>SunsetView.com</h1>
            </div>
            <div class="email-body">
              <h2>Booking Confirmation</h2>
              <p>Dear ${booking.firstName},</p>
              <p>Thank you for booking with SunsetView.com! Your reservation at <strong>${hotel.name}</strong> has been confirmed.</p>
              
              <div class="card">
                <h3>Booking Details</h3>
                <p class="booking-details"><strong>Booking Reference:</strong> ${booking._id}</p>
                <p class="booking-details"><strong>Hotel:</strong> ${hotel.name}</p>
                <p class="booking-details"><strong>Location:</strong> ${hotel.city}, ${hotel.country}</p>
                <p class="booking-details"><strong>Check-in Date:</strong> ${formatDate(checkInDate)} (from 3:00 PM)</p>
                <p class="booking-details"><strong>Check-out Date:</strong> ${formatDate(checkOutDate)} (until 11:00 AM)</p>
                <p class="booking-details"><strong>Duration:</strong> ${nightsStayed} night${nightsStayed !== 1 ? 's' : ''}</p>
                <p class="booking-details"><strong>Guests:</strong> ${booking.adultCount} Adult${booking.adultCount !== 1 ? 's' : ''}, ${booking.childrenCount} Child${booking.childrenCount !== 1 ? 'ren' : ''}</p>
              </div>
              
              <div class="card">
                <h3>Price Summary</h3>
                <table>
                  <tr>
                    <td>Adults (${booking.adultCount}) × £${hotel.pricePerNight} × ${nightsStayed} nights</td>
                    <td>£${adultCost.toFixed(2)}</td>
                  </tr>
                  ${booking.childrenCount > 0 ? `
                  <tr>
                    <td>Children (${booking.childrenCount}) × £${(hotel.pricePerNight / 2).toFixed(2)} × ${nightsStayed} nights</td>
                    <td>£${childrenCost.toFixed(2)}</td>
                  </tr>
                  ` : ''}
                  <tr class="total-row">
                    <td><strong>Total Amount</strong></td>
                    <td><strong>£${totalCost.toFixed(2)}</strong></td>
                  </tr>
                </table>
              </div>
              
              <div class="payment-card">
                <h3>Payment Information</h3>
                <p>Your payment has been processed successfully.</p>
                <p class="paid-text">PAID: £${totalCost.toFixed(2)}</p>
              </div>
              
              <div class="info-card">
                <h3>Need to make changes?</h3>
                <p>If you need to cancel or modify your booking, please contact us at <a href="mailto:support@sunsetview.com" style="color: #1565c0;">support@sunsetview.com</a> or visit your bookings page on our website.</p>
              </div>
              
              <p>We hope you have a wonderful stay at ${hotel.name}!</p>
              <p>Best regards,<br>The SunsetView.com Team</p>
            </div>
            <div class="email-footer">
              <p>&copy; ${new Date().getFullYear()} SunsetView.com. All rights reserved.</p>
              <p>This is an automated email, please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `
        };
        console.log(`Sending confirmation email to ${booking.email}...`);
        const result = yield transporter.sendMail(mailOptions);
        console.log("Email sent successfully:", result.messageId);
        return result;
    }
    catch (error) {
        console.error("Error sending booking confirmation email:", error instanceof Error ? error.message : String(error));
        // Don't throw so the booking process can still complete
    }
});
exports.sendBookingConfirmationEmail = sendBookingConfirmationEmail;

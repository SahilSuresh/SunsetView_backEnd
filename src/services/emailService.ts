// services/emailService.ts

// Import required modules
import nodemailer from 'nodemailer'; // Email sending service
import { BookingType, HotelType } from "../share/type"; // Shared types for bookings and hotels

/**
 * EMAIL TRANSPORTER CONFIGURATION
 * 
 * Here we set up the Nodemailer transporter to connect to an email server.
 * - We use environment variables for email provider, username, and password.
 * - This ensures that sensitive credentials are not hard-coded and can easily be changed per environment (development, production, etc).
 */
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * BASE EMAIL TEMPLATE
 * 
 * This function wraps the dynamic email content inside a fully styled HTML layout.
 * It ensures:
 * - Consistent branding (SunsetView.com colors, fonts, etc.)
 * - Mobile responsiveness
 * - Professional look for all emails
 * 
 * We pass in:
 * - title: the heading displayed on the email header
 * - content: the main dynamic body content
 */
const baseEmailTemplate = (title: string, content: string) => {
  const currentYear = new Date().getFullYear(); // To show the current year dynamically in the footer
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
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
        
        .email-header p {
          color: white;
          margin: 10px 0 0;
          font-size: 16px;
          font-weight: 500;
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
        
        .info-card {
          background-color: #e3f2fd;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 25px;
          border-left: 4px solid #2196f3;
        }
        
        .warning-card {
          background-color: #fff3e0;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 25px;
          border-left: 4px solid #ff9800;
        }
        
        .details-row {
          margin-bottom: 10px;
        }
        
        .details-row strong {
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
        
        .email-signature {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eeeeee;
        }
        
        .email-signature p {
          margin: 5px 0;
          color: #777777;
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
          
          .card, .payment-card, .info-card, .warning-card {
            padding: 15px;
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
          <p>${title}</p>
        </div>
        <div class="email-body">
          ${content}
          
          <div class="email-signature">
            <p>Best regards,</p>
            <p>The SunsetView.com Team</p>
          </div>
        </div>
        <div class="email-footer">
          <p>&copy; ${currentYear} SunsetView.com. All rights reserved.</p>
          <p>This is an automated message, please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * SEND EMAIL VERIFICATION LINK
 * 
 * This is called right after a user registers.
 * 
 * Logic:
 * - We generate a frontend URL including the token.
 * - We email the user a "Verify Email" button.
 * - The link expires in 24 hours (enforced on frontend or backend later).
 * 
 * Purpose:
 * - Ensure users confirm their email address before activating their account.
 */
export const sendVerificationEmail = async (
  to: string, 
  token: string, 
  firstName: string
) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  
  const content = `
    <h2>Hello ${firstName},</h2>
    <p>Thank you for registering with SunsetView! Please verify your email address to activate your account.</p>
    
    <div class="button-container">
      <a href="${verifyUrl}" class="button">Verify Email Address</a>
    </div>
    
    <p>If you did not create an account, you can safely ignore this email.</p>
    
    <div class="warning-card">
      <h3>Important Notice</h3>
      <p>This verification link will expire in 24 hours.</p>
    </div>
    
    <p>If the button doesn't work, copy and paste this URL into your browser:</p>
    <div class="card">
      <p style="word-break: break-all; font-size: 14px;">${verifyUrl}</p>
    </div>
  `;
  
  const mailOptions = {
    from: `"SunsetView.com" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Verify Your Email Address',
    html: baseEmailTemplate('Email Verification', content)
  };

  return transporter.sendMail(mailOptions);
};

/**
 * SEND PASSWORD RESET LINK
 * 
 * Called when the user clicks "Forgot Password?".
 * 
 * Logic:
 * - A one-time secure token is generated elsewhere.
 * - We embed this token into a reset password URL.
 * - We email them a reset password link.
 * 
 * Important:
 * - Link expires in 1 hour (enforced in token validation logic).
 * - User should never see if a certain email exists or not (done at API level for security).
 */
export const sendPasswordResetEmail = async (
  to: string, 
  token: string, 
  firstName: string
) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  
  const content = `
    <h2>Hello ${firstName},</h2>
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    
    <div class="button-container">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </div>
    
    <p>If you did not request a password reset, you can safely ignore this email.</p>
    
    <div class="warning-card">
      <h3>Important Notice</h3>
      <p>This link will expire in 1 hour.</p>
    </div>
    
    <p>If the button doesn't work, copy and paste this URL into your browser:</p>
    <div class="card">
      <p style="word-break: break-all; font-size: 14px;">${resetUrl}</p>
    </div>
  `;
  
  const mailOptions = {
    from: `"SunsetView.com" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Reset Your Password',
    html: baseEmailTemplate('Reset Your Password', content)
  };

  return transporter.sendMail(mailOptions);
};

/**
 * SEND BOOKING CONFIRMATION EMAIL
 * 
 * After the user successfully pays for a booking, we call this.
 * 
 * Logic:
 * - Calculate how many nights they are staying.
 * - Show a full summary: check-in, check-out, number of guests, price breakdown.
 * - Show total amount paid.
 * - Offer a link to contact support if they need to modify or cancel.
 * 
 * Why:
 * - Builds trust by confirming the booking immediately.
 * - Shows clear transparent information about the stay.
 */
export const sendBookingConfirmationEmail = async (
  booking: BookingType,
  hotel: HotelType
) => {
  try {
    console.log(`Starting email sending process for booking: ${booking._id}`);
    
    // Format dates for display
    const checkInDate = new Date(booking.checkIn);
    const checkOutDate = new Date(booking.checkOut);
    
    // Calculate the number of nights
    const nightsStayed = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Format dates in a more user-friendly way
    const formatDate = (date: Date) => {
      const options: Intl.DateTimeFormatOptions = { 
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
    
    const content = `
      <h2>Booking Confirmation</h2>
      <p>Dear ${booking.firstName},</p>
      <p>Thank you for booking with SunsetView.com! Your reservation at <strong>${hotel.name}</strong> has been confirmed.</p>
      
      <div class="card">
        <h3>Booking Details</h3>
        <p class="details-row"><strong>Booking Reference:</strong> ${booking._id}</p>
        <p class="details-row"><strong>Hotel:</strong> ${hotel.name}</p>
        <p class="details-row"><strong>Location:</strong> ${hotel.city}, ${hotel.country}</p>
        <p class="details-row"><strong>Check-in Date:</strong> ${formatDate(checkInDate)} (from 3:00 PM)</p>
        <p class="details-row"><strong>Check-out Date:</strong> ${formatDate(checkOutDate)} (until 11:00 AM)</p>
        <p class="details-row"><strong>Duration:</strong> ${nightsStayed} night${nightsStayed !== 1 ? 's' : ''}</p>
        <p class="details-row"><strong>Guests:</strong> ${booking.adultCount} Adult${booking.adultCount !== 1 ? 's' : ''}, ${booking.childrenCount} Child${booking.childrenCount !== 1 ? 'ren' : ''}</p>
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
            <td>Children (${booking.childrenCount}) × £${(hotel.pricePerNight/2).toFixed(2)} × ${nightsStayed} nights</td>
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
        <p style="text-align: center; font-size: 18px; font-weight: 600; color: #2e7d32; margin-top: 10px;">PAID: £${totalCost.toFixed(2)}</p>
      </div>
      
      <div class="info-card">
        <h3>Need to make changes?</h3>
        <p>If you need to cancel or modify your booking, please contact us at <a href="mailto:support@sunsetview.com" style="color: #1565c0;">support@sunsetview.com</a> or visit your bookings page on our website.</p>
      </div>
      
      <p>We hope you have a wonderful stay at ${hotel.name}!</p>
    `;
    
    const mailOptions = {
      from: `"SunsetView.com" <${process.env.EMAIL_USER}>`,
      to: booking.email,
      subject: `Booking Confirmation - ${hotel.name}`,
      html: baseEmailTemplate('Booking Confirmation', content)
    };
    
    console.log(`Sending confirmation email to ${booking.email}...`);
    const result = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", result.messageId);
    return result;
  } catch (error) {
    console.error("Error sending booking confirmation email:", 
      error instanceof Error ? error.message : String(error)
    );
    // Don't throw so the booking process can still complete
  }
};

/**
 * SEND CANCELLATION APPROVAL EMAIL
 * 
 * Logic:
 * - After admin approves the user's cancellation request.
 * - Confirm that booking is cancelled.
 * - Inform about refund processing if any.
 */
export const sendCancellationApprovedEmail = async (
  to: string,
  name: string,
  hotelName: string,
  bookingId: string
) => {
  try {
    const content = `
      <h2>Booking Cancellation Confirmed</h2>
      <p>Dear ${name},</p>
      
      <p>We're writing to confirm that your cancellation request for your booking at 
      <strong>${hotelName}</strong> (Booking ID: ${bookingId.substring(0, 8)}) has been <strong>approved</strong>.</p>
      
      <div class="card">
        <h3>Cancellation Details</h3>
        <p class="details-row"><strong>Hotel:</strong> ${hotelName}</p>
        <p class="details-row"><strong>Booking ID:</strong> ${bookingId.substring(0, 8)}</p>
        <p class="details-row"><strong>Status:</strong> <span style="color: #2e7d32; font-weight: 600;">Cancelled</span></p>
      </div>
      
      <p>Your booking has been successfully cancelled, and you should receive any applicable refund according to 
      our cancellation policy within 5-7 business days, depending on your payment method and financial institution.</p>
      
      <div class="info-card">
        <h3>Need assistance?</h3>
        <p>If you have any questions about your cancellation or need further assistance, please contact our customer 
        service team at <a href="mailto:support@sunsetview.com" style="color: #1565c0;">support@sunsetview.com</a>.</p>
      </div>
      
      <p>Thank you for choosing SunsetView.com. We hope to welcome you again in the future.</p>
    `;
    
    const mailOptions = {
      from: `"SunsetView.com" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Your Cancellation Request Has Been Approved',
      html: baseEmailTemplate('Booking Cancellation Confirmation', content)
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Cancellation approved email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending cancellation approved email:', error);
    throw error;
  }
};

/**
 * SEND CANCELLATION REJECTION EMAIL
 * 
 * Logic:
 * - After admin reviews a cancellation request but cannot approve it.
 * - Explain clearly to the user that the booking is still active.
 */
export const sendCancellationRejectedEmail = async (
  to: string,
  name: string,
  hotelName: string,
  bookingId: string
) => {
  try {
    const content = `
      <h2>Booking Cancellation Update</h2>
      <p>Dear ${name},</p>
      
      <p>We're writing regarding your cancellation request for your booking at 
      <strong>${hotelName}</strong> (Booking ID: ${bookingId.substring(0, 8)}).</p>
      
      <div class="card">
        <h3>Booking Details</h3>
        <p class="details-row"><strong>Hotel:</strong> ${hotelName}</p>
        <p class="details-row"><strong>Booking ID:</strong> ${bookingId.substring(0, 8)}</p>
        <p class="details-row"><strong>Status:</strong> <span style="color: #1565c0; font-weight: 600;">Active</span></p>
      </div>
      
      <div class="warning-card">
        <h3>Cancellation Request Status</h3>
        <p>After careful review, we regret to inform you that your cancellation request could not be approved 
        at this time. This is typically due to our cancellation policy timeframes or the specific terms agreed 
        upon at the time of booking.</p>
      </div>
      
      <p>If you wish to discuss this further or explore other options, please contact our customer service team at 
      <a href="mailto:support@sunsetview.com" style="color: #1565c0;">support@sunsetview.com</a>, and we'll be happy to assist you.</p>
      
      <p>Your booking remains active, and we look forward to welcoming you as planned.</p>
    `;
    
    const mailOptions = {
      from: `"SunsetView.com" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Update on Your Cancellation Request',
      html: baseEmailTemplate('Booking Cancellation Update', content)
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Cancellation rejected email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending cancellation rejected email:', error);
    throw error;
  }
};
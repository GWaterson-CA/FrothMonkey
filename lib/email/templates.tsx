import * as React from 'react'

interface EmailLayoutProps {
  previewText: string
  children: React.ReactNode
}

// Base email layout with FrothMonkey branding
export function EmailLayout({ previewText, children }: EmailLayoutProps) {
  return (
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>{previewText}</title>
        <style>{`
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            text-align: center;
          }
          .logo {
            max-width: 200px;
            height: auto;
          }
          .content {
            padding: 40px 30px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
            color: #1a1a1a;
          }
          .message {
            font-size: 16px;
            margin-bottom: 30px;
            color: #4a4a4a;
          }
          .button {
            display: inline-block;
            padding: 14px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
          }
          .button:hover {
            opacity: 0.9;
          }
          .details {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .details-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e5e5;
          }
          .details-row:last-child {
            border-bottom: none;
          }
          .details-label {
            font-weight: 600;
            color: #666;
          }
          .details-value {
            color: #333;
            font-weight: 500;
          }
          .footer {
            padding: 30px;
            text-align: center;
            color: #999;
            font-size: 14px;
            border-top: 1px solid #e5e5e5;
          }
          .footer a {
            color: #667eea;
            text-decoration: none;
          }
          @media only screen and (max-width: 600px) {
            .content {
              padding: 30px 20px;
            }
            .title {
              font-size: 20px;
            }
            .message {
              font-size: 14px;
            }
          }
        `}</style>
      </head>
      <body>
        <div style={{ display: 'none', maxHeight: 0, overflow: 'hidden' }}>
          {previewText}
        </div>
        <div className="email-container">
          <div className="header">
            <img 
              src="https://frothmonkey.com/FrothMonkey%20Logo%20Blue.png" 
              alt="FrothMonkey" 
              className="logo"
              width="200"
            />
          </div>
          <div className="content">
            {children}
          </div>
          <div className="footer">
            <p>
              © {new Date().getFullYear()} FrothMonkey. All rights reserved.
            </p>
            <p>
              <a href="https://frothmonkey.com/account/settings">Manage notification preferences</a> | 
              <a href="https://frothmonkey.com/privacy"> Privacy Policy</a> | 
              <a href="https://frothmonkey.com/terms"> Terms of Service</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}

interface OutbidEmailProps {
  recipientName: string
  listingTitle: string
  listingUrl: string
  previousBid: number
  newBid: number
}

export function OutbidEmail({ 
  recipientName, 
  listingTitle, 
  listingUrl, 
  previousBid, 
  newBid 
}: OutbidEmailProps) {
  return (
    <EmailLayout previewText={`You've been outbid on "${listingTitle}"`}>
      <h1 className="title">😔 You've Been Outbid!</h1>
      <p className="message">
        Hi {recipientName},
      </p>
      <p className="message">
        Someone has placed a higher bid on an auction you were winning. Don't let it slip away!
      </p>
      
      <div className="details">
        <div className="details-row">
          <span className="details-label">Listing:</span>
          <span className="details-value">{listingTitle}</span>
        </div>
        <div className="details-row">
          <span className="details-label">Your Bid:</span>
          <span className="details-value">${previousBid.toFixed(2)}</span>
        </div>
        <div className="details-row">
          <span className="details-label">Current Bid:</span>
          <span className="details-value">${newBid.toFixed(2)}</span>
        </div>
      </div>

      <p style={{ textAlign: 'center', marginTop: 30 }}>
        <a href={listingUrl} className="button">
          Place a Higher Bid
        </a>
      </p>
    </EmailLayout>
  )
}

interface TimeWarningEmailProps {
  recipientName: string
  listingTitle: string
  listingUrl: string
  currentBid: number
  hoursRemaining: number
  isLeadingBidder: boolean
}

export function TimeWarningEmail({ 
  recipientName, 
  listingTitle, 
  listingUrl, 
  currentBid,
  hoursRemaining,
  isLeadingBidder
}: TimeWarningEmailProps) {
  const hourText = hoursRemaining === 1 ? 'hour' : 'hours'
  
  return (
    <EmailLayout previewText={`${hoursRemaining} ${hourText} left on "${listingTitle}"`}>
      <h1 className="title">⏰ Auction Ending Soon!</h1>
      <p className="message">
        Hi {recipientName},
      </p>
      <p className="message">
        An auction you're bidding on is ending in {hoursRemaining} {hourText}!
        {isLeadingBidder ? " You're currently the highest bidder. " : " Time to make your move! "}
      </p>
      
      <div className="details">
        <div className="details-row">
          <span className="details-label">Listing:</span>
          <span className="details-value">{listingTitle}</span>
        </div>
        <div className="details-row">
          <span className="details-label">Current Bid:</span>
          <span className="details-value">${currentBid.toFixed(2)}</span>
        </div>
        <div className="details-row">
          <span className="details-label">Time Remaining:</span>
          <span className="details-value">{hoursRemaining} {hourText}</span>
        </div>
        <div className="details-row">
          <span className="details-label">Status:</span>
          <span className="details-value">
            {isLeadingBidder ? '✅ You\'re winning!' : '⚠️ You\'re not winning'}
          </span>
        </div>
      </div>

      <p style={{ textAlign: 'center', marginTop: 30 }}>
        <a href={listingUrl} className="button">
          View Auction
        </a>
      </p>
    </EmailLayout>
  )
}

interface AuctionEndedSellerEmailProps {
  recipientName: string
  listingTitle: string
  listingUrl: string
  finalBid: number
  buyerName: string
  reserveMet: boolean
  hadBids: boolean
}

export function AuctionEndedSellerEmail({ 
  recipientName, 
  listingTitle, 
  listingUrl, 
  finalBid,
  buyerName,
  reserveMet,
  hadBids
}: AuctionEndedSellerEmailProps) {
  return (
    <EmailLayout previewText={`Your auction "${listingTitle}" has ended`}>
      <h1 className="title">
        {reserveMet ? '🎉 Your Auction Sold!' : hadBids ? '📊 Your Auction Ended' : '📭 Your Auction Ended'}
      </h1>
      <p className="message">
        Hi {recipientName},
      </p>
      <p className="message">
        {reserveMet 
          ? `Congratulations! Your auction has ended successfully and your item sold to ${buyerName}.`
          : hadBids
          ? `Your auction has ended. The reserve price was not met, but you can review the bids and contact the highest bidder if you wish.`
          : 'Your auction has ended with no bids.'}
      </p>
      
      {hadBids && (
        <div className="details">
          <div className="details-row">
            <span className="details-label">Listing:</span>
            <span className="details-value">{listingTitle}</span>
          </div>
          <div className="details-row">
            <span className="details-label">Final Bid:</span>
            <span className="details-value">${finalBid.toFixed(2)}</span>
          </div>
          {reserveMet && (
            <div className="details-row">
              <span className="details-label">Highest Bidder:</span>
              <span className="details-value">{buyerName}</span>
            </div>
          )}
          <div className="details-row">
            <span className="details-label">Status:</span>
            <span className="details-value">
              {reserveMet ? '✅ Sold - Reserve Met' : '⚠️ Reserve Not Met'}
            </span>
          </div>
        </div>
      )}

      <p style={{ textAlign: 'center', marginTop: 30 }}>
        <a href={listingUrl} className="button">
          View Listing Details
        </a>
      </p>
      
      {reserveMet && (
        <p className="message" style={{ marginTop: 30, fontSize: 14 }}>
          <strong>Next Steps:</strong> You can now exchange contact information with the buyer through our messaging system.
        </p>
      )}
    </EmailLayout>
  )
}

interface AuctionWonBuyerEmailProps {
  recipientName: string
  listingTitle: string
  listingUrl: string
  finalBid: number
  sellerName: string
}

export function AuctionWonBuyerEmail({ 
  recipientName, 
  listingTitle, 
  listingUrl, 
  finalBid,
  sellerName
}: AuctionWonBuyerEmailProps) {
  return (
    <EmailLayout previewText={`Congratulations! You won "${listingTitle}"`}>
      <h1 className="title">🎉 Congratulations! You Won!</h1>
      <p className="message">
        Hi {recipientName},
      </p>
      <p className="message">
        Congratulations! You've won the auction and can now arrange delivery or pickup with {sellerName}.
      </p>
      
      <div className="details">
        <div className="details-row">
          <span className="details-label">Listing:</span>
          <span className="details-value">{listingTitle}</span>
        </div>
        <div className="details-row">
          <span className="details-label">Your Winning Bid:</span>
          <span className="details-value">${finalBid.toFixed(2)}</span>
        </div>
        <div className="details-row">
          <span className="details-label">Seller:</span>
          <span className="details-value">{sellerName}</span>
        </div>
      </div>

      <p style={{ textAlign: 'center', marginTop: 30 }}>
        <a href={listingUrl} className="button">
          Contact Seller
        </a>
      </p>
      
      <p className="message" style={{ marginTop: 30, fontSize: 14 }}>
        <strong>Next Steps:</strong> Connect with the seller through our messaging system to arrange payment and delivery. Remember to leave a review after the transaction!
      </p>
    </EmailLayout>
  )
}

interface TestEmailProps {
  recipientName: string
  testMessage: string
}

export function TestEmail({ recipientName, testMessage }: TestEmailProps) {
  return (
    <EmailLayout previewText="Test Email from FrothMonkey">
      <h1 className="title">🧪 Test Email</h1>
      <p className="message">
        Hi {recipientName},
      </p>
      <p className="message">
        {testMessage}
      </p>
      
      <div className="details">
        <div className="details-row">
          <span className="details-label">Test Time:</span>
          <span className="details-value">{new Date().toLocaleString()}</span>
        </div>
        <div className="details-row">
          <span className="details-label">Status:</span>
          <span className="details-value">✅ Email System Working</span>
        </div>
      </div>

      <p style={{ textAlign: 'center', marginTop: 30 }}>
        <a href="https://frothmonkey.com" className="button">
          Visit FrothMonkey
        </a>
      </p>
    </EmailLayout>
  )
}

interface ConfirmEmailProps {
  recipientName: string
  confirmationUrl: string
}

export function ConfirmEmail({ recipientName, confirmationUrl }: ConfirmEmailProps) {
  return (
    <EmailLayout previewText="Welcome to FrothMonkey! Confirm your email to get started">
      <h1 className="title">🎉 Welcome to FrothMonkey!</h1>
      <p className="message">
        Hi {recipientName},
      </p>
      <p className="message">
        Thank you for creating an account with FrothMonkey! We're excited to have you join our community of auction enthusiasts.
      </p>
      <p className="message">
        To get started, please confirm your email address by clicking the button below:
      </p>

      <p style={{ textAlign: 'center', marginTop: 30, marginBottom: 30 }}>
        <a href={confirmationUrl} className="button">
          Click to Complete Your Profile
        </a>
      </p>

      <p className="message" style={{ fontSize: 14, color: '#666' }}>
        Once you've confirmed your email, you'll be able to:
      </p>
      <ul style={{ fontSize: 14, color: '#666', marginTop: 10, marginBottom: 20, paddingLeft: 20 }}>
        <li>Browse and bid on exciting auctions</li>
        <li>Create your own listings to sell items</li>
        <li>Track your bids and watchlist</li>
        <li>Receive notifications about auctions you're interested in</li>
      </ul>

      <p className="message" style={{ fontSize: 14, color: '#666', marginTop: 20 }}>
        If you didn't create an account with FrothMonkey, you can safely ignore this email.
      </p>
    </EmailLayout>
  )
}

interface ResetPasswordEmailProps {
  recipientName: string
  resetUrl: string
}

export function ResetPasswordEmail({ recipientName, resetUrl }: ResetPasswordEmailProps) {
  return (
    <EmailLayout previewText="Reset your FrothMonkey password">
      <h1 className="title">🔐 Reset Your Password</h1>
      <p className="message">
        Hi {recipientName},
      </p>
      <p className="message">
        We received a request to reset your password for your FrothMonkey account. If you made this request, click the button below to create a new password:
      </p>

      <p style={{ textAlign: 'center', marginTop: 30, marginBottom: 30 }}>
        <a href={resetUrl} className="button">
          Reset Your Password
        </a>
      </p>

      <div className="details">
        <div className="details-row">
          <span className="details-label">⏱️ Link Expires:</span>
          <span className="details-value">1 hour from request</span>
        </div>
        <div className="details-row">
          <span className="details-label">🔒 Security:</span>
          <span className="details-value">This link can only be used once</span>
        </div>
      </div>

      <p className="message" style={{ fontSize: 14, color: '#666', marginTop: 30 }}>
        <strong>Didn't request a password reset?</strong>
        <br />
        If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged and your account is secure.
      </p>

      <p className="message" style={{ fontSize: 14, color: '#666', marginTop: 20 }}>
        For security reasons, this link will expire in 1 hour. If you need to reset your password after that, please request a new reset link.
      </p>
    </EmailLayout>
  )
}

interface FavoriteReserveMetEmailProps {
  recipientName: string
  listingTitle: string
  listingUrl: string
  currentBid: number
  timeRemaining: string
}

export function FavoriteReserveMetEmail({ 
  recipientName, 
  listingTitle, 
  listingUrl, 
  currentBid,
  timeRemaining
}: FavoriteReserveMetEmailProps) {
  return (
    <EmailLayout previewText={`Reserve met on "${listingTitle}"`}>
      <h1 className="title">🎯 Reserve Price Met!</h1>
      <p className="message">
        Hi {recipientName},
      </p>
      <p className="message">
        Great news! The reserve price has been met on a listing you favorited. This means the seller is committed to selling!
      </p>
      
      <div className="details">
        <div className="details-row">
          <span className="details-label">Listing:</span>
          <span className="details-value">{listingTitle}</span>
        </div>
        <div className="details-row">
          <span className="details-label">Current Bid:</span>
          <span className="details-value">${currentBid.toFixed(2)}</span>
        </div>
        <div className="details-row">
          <span className="details-label">Time Remaining:</span>
          <span className="details-value">{timeRemaining}</span>
        </div>
        <div className="details-row">
          <span className="details-label">Status:</span>
          <span className="details-value">✅ Reserve Met</span>
        </div>
      </div>

      <p style={{ textAlign: 'center', marginTop: 30 }}>
        <a href={listingUrl} className="button">
          View Listing & Place Bid
        </a>
      </p>
      
      <p className="message" style={{ marginTop: 30, fontSize: 14 }}>
        Don't miss this opportunity! Place your bid now to win this item.
      </p>
    </EmailLayout>
  )
}

interface FavoriteEndingSoonEmailProps {
  recipientName: string
  listingTitle: string
  listingUrl: string
  currentBid: number
  reserveMet: boolean
}

export function FavoriteEndingSoonEmail({ 
  recipientName, 
  listingTitle, 
  listingUrl, 
  currentBid,
  reserveMet
}: FavoriteEndingSoonEmailProps) {
  return (
    <EmailLayout previewText={`Less than 24h left on "${listingTitle}"`}>
      <h1 className="title">⏰ Favorited Listing Ending Soon!</h1>
      <p className="message">
        Hi {recipientName},
      </p>
      <p className="message">
        A listing you favorited is ending in less than 24 hours! {reserveMet ? 'The reserve has been met, so this auction will sell.' : 'Act fast before it\'s gone!'}
      </p>
      
      <div className="details">
        <div className="details-row">
          <span className="details-label">Listing:</span>
          <span className="details-value">{listingTitle}</span>
        </div>
        <div className="details-row">
          <span className="details-label">Current Bid:</span>
          <span className="details-value">${currentBid.toFixed(2)}</span>
        </div>
        <div className="details-row">
          <span className="details-label">Time Remaining:</span>
          <span className="details-value">Less than 24 hours</span>
        </div>
        <div className="details-row">
          <span className="details-label">Status:</span>
          <span className="details-value">
            {reserveMet ? '✅ Reserve Met' : '⏳ Ending Soon'}
          </span>
        </div>
      </div>

      <p style={{ textAlign: 'center', marginTop: 30 }}>
        <a href={listingUrl} className="button">
          Place Your Bid Now
        </a>
      </p>
      
      <p className="message" style={{ marginTop: 30, fontSize: 14 }}>
        This is your last chance! Don't let this opportunity slip away.
      </p>
    </EmailLayout>
  )
}

interface QuestionReceivedEmailProps {
  recipientName: string
  listingTitle: string
  listingUrl: string
  question: string
  askerName: string
}

export function QuestionReceivedEmail({ 
  recipientName, 
  listingTitle, 
  listingUrl, 
  question,
  askerName
}: QuestionReceivedEmailProps) {
  return (
    <EmailLayout previewText={`New question on "${listingTitle}"`}>
      <h1 className="title">❓ New Question on Your Listing</h1>
      <p className="message">
        Hi {recipientName},
      </p>
      <p className="message">
        {askerName} has asked a question about your listing "{listingTitle}".
      </p>
      
      <div className="details">
        <div className="details-row">
          <span className="details-label">Listing:</span>
          <span className="details-value">{listingTitle}</span>
        </div>
        <div className="details-row">
          <span className="details-label">Asked by:</span>
          <span className="details-value">{askerName}</span>
        </div>
      </div>

      <div style={{ 
        backgroundColor: '#f9f9f9', 
        padding: '20px', 
        borderRadius: '8px', 
        marginTop: '20px',
        borderLeft: '4px solid #667eea'
      }}>
        <p style={{ 
          fontStyle: 'italic', 
          color: '#4a4a4a',
          margin: 0,
          fontSize: '15px',
          lineHeight: '1.6'
        }}>
          "{question}"
        </p>
      </div>

      <p style={{ textAlign: 'center', marginTop: 30 }}>
        <a href={listingUrl} className="button">
          Answer Question
        </a>
      </p>
      
      <p className="message" style={{ marginTop: 30, fontSize: 14 }}>
        Answering questions promptly helps build trust with potential buyers and can lead to more bids!
      </p>
    </EmailLayout>
  )
}

interface QuestionAnsweredEmailProps {
  recipientName: string
  listingTitle: string
  listingUrl: string
  question: string
  answer: string
  sellerName: string
}

export function QuestionAnsweredEmail({ 
  recipientName, 
  listingTitle, 
  listingUrl, 
  question,
  answer,
  sellerName
}: QuestionAnsweredEmailProps) {
  return (
    <EmailLayout previewText={`Your question about "${listingTitle}" was answered`}>
      <h1 className="title">✅ Your Question Was Answered</h1>
      <p className="message">
        Hi {recipientName},
      </p>
      <p className="message">
        {sellerName} has answered your question about "{listingTitle}".
      </p>
      
      <div className="details">
        <div className="details-row">
          <span className="details-label">Listing:</span>
          <span className="details-value">{listingTitle}</span>
        </div>
        <div className="details-row">
          <span className="details-label">Answered by:</span>
          <span className="details-value">{sellerName}</span>
        </div>
      </div>

      <div style={{ 
        backgroundColor: '#f9f9f9', 
        padding: '20px', 
        borderRadius: '8px', 
        marginTop: '20px',
        borderLeft: '4px solid #999'
      }}>
        <p style={{ 
          fontSize: '13px',
          color: '#999',
          margin: '0 0 10px 0',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Your Question:
        </p>
        <p style={{ 
          fontStyle: 'italic', 
          color: '#666',
          margin: '0 0 20px 0',
          fontSize: '14px'
        }}>
          "{question}"
        </p>
        <p style={{ 
          fontSize: '13px',
          color: '#999',
          margin: '0 0 10px 0',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Answer:
        </p>
        <p style={{ 
          color: '#333',
          margin: 0,
          fontSize: '15px',
          lineHeight: '1.6',
          fontWeight: 500
        }}>
          {answer}
        </p>
      </div>

      <p style={{ textAlign: 'center', marginTop: 30 }}>
        <a href={listingUrl} className="button">
          View Listing
        </a>
      </p>
      
      <p className="message" style={{ marginTop: 30, fontSize: 14 }}>
        Now that your question has been answered, you can place a bid if you're interested!
      </p>
    </EmailLayout>
  )
}


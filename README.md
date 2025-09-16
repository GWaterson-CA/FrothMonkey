# FrothMonkey

FrothMonkey is a modern, production-ready auction platform built with Next.js 14, Supabase, and TypeScript. Similar to TradeMe, this platform allows users to buy and sell unique items through live auctions with real-time bidding, anti-sniping protection, and comprehensive user management.

## ✨ Features

### Core Functionality
- **User Authentication**: Email/password signup with OAuth placeholders
- **Profile Management**: Custom usernames, profiles, and admin roles
- **Live Auctions**: Real-time bidding with WebSocket connections
- **Anti-Sniping Protection**: Automatic time extensions for last-minute bids
- **Buy Now Option**: Instant purchase functionality
- **Reserve Prices**: Optional minimum sale prices
- **Watchlists**: Save favorite items for later
- **Categories**: Organized browsing (Kids Toys, Bikes, Home & Garden, Vehicles)
- **Advanced Search**: Full-text search with filtering and sorting
- **Image Upload**: Multiple images per listing with Supabase Storage
- **Automatic Finalization**: Scheduled functions to end auctions and notify users

### Technical Features
- **Real-time Updates**: Supabase Realtime for live bid updates
- **Row Level Security**: Comprehensive database security policies
- **Server Actions**: Modern Next.js server-side operations
- **Responsive Design**: Mobile-first UI with Tailwind CSS
- **TypeScript**: Full type safety throughout the application
- **Edge Functions**: Serverless functions for auction management

## 🛠 Tech Stack

- **Framework**: Next.js 14+ (App Router) with TypeScript
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage for images
- **Real-time**: Supabase Realtime
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: TanStack Query
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Deployment**: Vercel (recommended)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Supabase CLI (optional but recommended)
- Supabase account

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd frothmonkey
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase project**
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key

4. **Configure environment variables**
   Create a `.env.local` file:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # Application Configuration
   REVALIDATE_SECRET=your-revalidate-secret
   SITE_URL=http://localhost:3000
   ```

5. **Run database migrations**
   ```bash
   # Using Supabase CLI (recommended)
   supabase db push

   # Or manually run the SQL files in your Supabase dashboard
   # Files: supabase/migrations/*.sql
   ```

6. **Set up storage bucket**
   - Go to your Supabase dashboard → Storage
   - The migration should have created the `listing-images` bucket
   - Verify the RLS policies are in place

7. **Deploy Edge Functions (optional for local development)**
   ```bash
   supabase functions deploy finalize-auctions
   supabase functions deploy revalidate
   ```

8. **Start the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the application.

### Database Schema

The application uses the following main tables:
- `profiles` - User profiles and admin flags
- `categories` - Auction categories
- `listings` - Auction items with pricing and timing
- `bids` - Bid history and amounts
- `listing_images` - Image storage references
- `watchlists` - User favorites
- `transactions` - Completed sales

Key features:
- **Generated columns** for `reserve_met` and `buy_now_enabled`
- **Full-text search** indexes on listing titles and descriptions
- **RLS policies** for data security
- **SQL functions** for bidding logic and auction finalization

## 📝 Development Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:generate  # Generate TypeScript types from Supabase
npm run db:migrate   # Push database changes

# Code Quality
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript checks
```

## 🏗 Architecture

### App Structure
```
app/
├── (auth)/           # Authentication pages
├── listing/[id]/     # Individual listing pages
├── category/[slug]/  # Category browsing
├── sell/            # Listing creation/editing
├── account/         # User dashboard
└── api/             # API routes and webhooks
```

### Key Components
- `Header` - Navigation with search and user menu
- `ListingCard` - Auction item display with real-time updates
- `BidForm` - Bidding interface with validation
- `CountdownTimer` - Real-time auction countdown
- `BidHistory` - Live bid feed with WebSocket updates

### Database Functions
- `place_bid()` - Handles bid placement with business logic
- `next_min_bid()` - Calculates minimum bid requirements
- `finalize_auctions()` - Processes ended auctions
- `min_bid_increment()` - Determines bid increments by price tier

## 🔧 Configuration

### Supabase Setup

1. **RLS Policies**: All tables have Row Level Security enabled
2. **Storage Bucket**: `listing-images` with public read, authenticated write
3. **Edge Functions**: Deployed for auction finalization and revalidation
4. **Scheduled Functions**: Set up cron job to run every minute

### Vercel Deployment

1. **Connect repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Configure build settings**:
   - Build Command: `npm run build`
   - Output Directory: `.next`
4. **Set up Supabase Edge Functions** with production URLs

### Production Considerations

- **Scheduled Functions**: Configure in Supabase dashboard to call the finalize-auctions Edge Function every minute
- **Email Integration**: Add email service (Resend, SendGrid) for notifications
- **Image Optimization**: Configure Next.js image domains for Supabase Storage
- **Rate Limiting**: Implement Redis-based rate limiting for production
- **Monitoring**: Add error tracking and performance monitoring

## 🧪 Testing

The application includes:
- **Type Safety**: Full TypeScript coverage
- **Form Validation**: Zod schemas for all user inputs  
- **Database Constraints**: SQL-level validation and constraints
- **RLS Testing**: Policies tested for security

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub/GitLab
2. Connect repository to Vercel
3. Set environment variables
4. Deploy!

### Manual Deployment

1. Build the application: `npm run build`
2. Set up hosting with Node.js support
3. Configure environment variables
4. Start with: `npm start`

## 📋 TODO / Roadmap

- [ ] Payment integration (Stripe)
- [ ] Shipping management
- [ ] User ratings and reviews
- [ ] Advanced admin moderation tools
- [ ] Email notifications (winner/seller/outbid)
- [ ] Mobile app (React Native)
- [ ] Advanced search filters
- [ ] Bulk listing tools
- [ ] Analytics dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the [Issues](https://github.com/your-repo/issues) page
- Review the Supabase documentation
- Check Next.js documentation for framework-specific questions

---

Built with ❤️ using Next.js and Supabase

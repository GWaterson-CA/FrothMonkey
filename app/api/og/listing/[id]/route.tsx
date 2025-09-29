import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    const { data: listing } = await supabase
      .from('listings')
      .select(`
        title,
        description,
        current_price,
        start_price,
        end_time,
        status,
        cover_image_url,
        location,
        categories (
          name
        )
      `)
      .eq('id', params.id)
      .single()

    if (!listing) {
      return new Response('Listing not found', { status: 404 })
    }

    const currentPrice = listing.current_price || listing.start_price
    const priceText = currentPrice > 0 
      ? `$${currentPrice.toLocaleString()}` 
      : `Starting at $${listing.start_price.toLocaleString()}`
    
    const endTime = new Date(listing.end_time)
    const now = new Date()
    const timeLeft = endTime.getTime() - now.getTime()
    const hoursLeft = Math.max(0, Math.ceil(timeLeft / (1000 * 60 * 60)))
    
    const timeText = hoursLeft > 24 
      ? `${Math.ceil(hoursLeft / 24)} days left`
      : hoursLeft > 0 
        ? `${hoursLeft} hours left`
        : 'Ended'

    // Get the full image URL
    const imageUrl = listing.cover_image_url 
      ? (listing.cover_image_url.startsWith('http') 
          ? listing.cover_image_url 
          : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-images/${listing.cover_image_url}`)
      : null

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            backgroundColor: '#ffffff',
            position: 'relative',
          }}
        >
          {/* Left side - Image */}
          {imageUrl ? (
            <div
              style={{
                width: '50%',
                height: '100%',
                display: 'flex',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <img
                src={imageUrl}
                alt={listing.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>
          ) : null}

          {/* Right side or Full - Content */}
          <div
            style={{
              width: imageUrl ? '50%' : '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#ffffff',
              backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              position: 'relative',
            }}
          >
            {/* Background Pattern */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
              }}
            />
            
            {/* Main Content */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: imageUrl ? '40px' : '60px',
                maxWidth: imageUrl ? '500px' : '1000px',
                textAlign: 'center',
                position: 'relative',
                zIndex: 1,
              }}
            >
            {/* Category Badge */}
            {listing.categories?.name && (
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '16px',
                  fontWeight: '500',
                  marginBottom: '20px',
                  backdropFilter: 'blur(10px)',
                }}
              >
                {listing.categories.name}
              </div>
            )}

              {/* Title */}
              <h1
                style={{
                  fontSize: imageUrl ? '36px' : '48px',
                  fontWeight: 'bold',
                  color: 'white',
                  margin: '0 0 15px 0',
                  lineHeight: '1.2',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                }}
              >
                {listing.title.length > 60 
                  ? `${listing.title.substring(0, 60)}...`
                  : listing.title
                }
              </h1>

              {/* Description - only show if no image */}
              {!imageUrl && listing.description && (
                <p
                  style={{
                    fontSize: '24px',
                    color: 'rgba(255, 255, 255, 0.9)',
                    margin: '0 0 30px 0',
                    lineHeight: '1.4',
                    maxWidth: '800px',
                  }}
                >
                  {listing.description.length > 120 
                    ? `${listing.description.substring(0, 120)}...`
                    : listing.description
                  }
                </p>
              )}

              {/* Price and Time Info */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: imageUrl ? 'column' : 'row',
                  alignItems: 'center',
                  gap: imageUrl ? '15px' : '40px',
                  marginBottom: imageUrl ? '20px' : '30px',
                  width: '100%',
                }}
              >
                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    padding: imageUrl ? '12px 20px' : '16px 24px',
                    borderRadius: '12px',
                    backdropFilter: 'blur(10px)',
                    width: imageUrl ? '100%' : 'auto',
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.8)',
                      marginBottom: '4px',
                    }}
                  >
                    Current Bid
                  </div>
                  <div
                    style={{
                      fontSize: imageUrl ? '24px' : '32px',
                      fontWeight: 'bold',
                      color: 'white',
                    }}
                  >
                    {priceText}
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    padding: imageUrl ? '12px 20px' : '16px 24px',
                    borderRadius: '12px',
                    backdropFilter: 'blur(10px)',
                    width: imageUrl ? '100%' : 'auto',
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.8)',
                      marginBottom: '4px',
                    }}
                  >
                    Time Left
                  </div>
                  <div
                    style={{
                      fontSize: imageUrl ? '20px' : '24px',
                      fontWeight: 'bold',
                      color: 'white',
                    }}
                  >
                    {timeText}
                  </div>
                </div>
              </div>

              {/* Location */}
              {listing.location && (
                <div
                  style={{
                    fontSize: imageUrl ? '14px' : '18px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    marginBottom: imageUrl ? '15px' : '20px',
                  }}
                >
                  📍 {listing.location}
                </div>
              )}

              {/* CTA */}
              <div
                style={{
                  backgroundColor: 'white',
                  color: '#667eea',
                  padding: imageUrl ? '12px 24px' : '16px 32px',
                  borderRadius: '30px',
                  fontSize: imageUrl ? '16px' : '20px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                }}
              >
                Bid Now on FrothMonkey
              </div>
            </div>

            {/* Logo */}
            <div
              style={{
                position: 'absolute',
                top: '30px',
                right: imageUrl ? '30px' : '40px',
                fontSize: imageUrl ? '18px' : '24px',
                fontWeight: 'bold',
                color: 'white',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              }}
            >
              FrothMonkey
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error) {
    console.error('OG image generation error:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ListingsGrid } from '@/components/listings-grid'

export function ListingsTabs() {
  return (
    <div id="featured">
      <Tabs defaultValue="newly-listed" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="ending-soon">Ending Soon</TabsTrigger>
          <TabsTrigger value="newly-listed">Newly Listed</TabsTrigger>
          <TabsTrigger value="reserve-met">Reserve Met</TabsTrigger>
        </TabsList>
        
        <TabsContent value="ending-soon" className="mt-6">
          <ListingsGrid searchParams={{ filter: 'ending-soon' }} />
        </TabsContent>
        
        <TabsContent value="newly-listed" className="mt-6">
          <ListingsGrid searchParams={{ filter: 'newly-listed' }} />
        </TabsContent>
        
        <TabsContent value="reserve-met" className="mt-6">
          <ListingsGrid searchParams={{ filter: 'reserve-met' }} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

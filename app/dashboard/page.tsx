// app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import {
  BedDouble,
  CalendarCheck,
  CalendarX,
  TrendingUp,
  Users,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('owner_id', user?.id)
    .single()

  // Get stats
  const { data: stats } = await supabase.rpc('get_tenant_stats', {
    tenant_uuid: tenant?.id
  })

  // Get recent bookings
  const { data: recentBookings } = await supabase
    .from('bookings')
    .select('*, guest:guests(first_name, last_name), room:rooms(number)')
    .eq('tenant_id', tenant?.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Occupancy Rate"
          value={`${stats?.occupancy_rate || 0}%`}
          trend="+12%"
          trendUp={true}
          icon={BedDouble}
          color="blue"
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(stats?.month_revenue || 0)}
          trend="+8%"
          trendUp={true}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Today's Check-ins"
          value={stats?.today_checkins || 0}
          trend="3 pending"
          trendUp={true}
          icon={CalendarCheck}
          color="purple"
        />
        <StatCard
          title="Today's Check-outs"
          value={stats?.today_checkouts || 0}
          trend="2 ready"
          trendUp={false}
          icon={CalendarX}
          color="orange"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <QuickActionButton
                href="/dashboard/bookings/new"
                label="New Booking"
                color="bg-blue-50 text-blue-600"
              />
              <QuickActionButton
                href="/dashboard/rooms"
                label="View Rooms"
                color="bg-green-50 text-green-600"
              />
              <QuickActionButton
                href="/dashboard/guests/new"
                label="Add Guest"
                color="bg-purple-50 text-purple-600"
              />
              <QuickActionButton
                href="/dashboard/payments"
                label="Record Payment"
                color="bg-orange-50 text-orange-600"
              />
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Recent Bookings</h2>
              <Link href="/dashboard/bookings" className="text-primary-600 text-sm hover:underline">
                View all
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-3 font-medium">Guest</th>
                    <th className="pb-3 font-medium">Room</th>
                    <th className="pb-3 font-medium">Dates</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {recentBookings?.map((booking: any) => (
                    <tr key={booking.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">
                        {booking.guest?.first_name} {booking.guest?.last_name}
                      </td>
                      <td className="py-3 text-gray-600">Room {booking.room?.number}</td>
                      <td className="py-3 text-gray-600">
                        {new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}
                      </td>
                      <td className="py-3 font-semibold">{formatCurrency(booking.final_amount)}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          booking.status === 'checked_in' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Room Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold mb-4">Room Status</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Available</span>
                <span className="font-bold text-green-600">{stats?.available_rooms || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(stats?.available_rooms / stats?.total_rooms) * 100}%` }}></div>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <span className="text-gray-600">Occupied</span>
                <span className="font-bold text-red-600">{stats?.occupied_rooms || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(stats?.occupied_rooms / stats?.total_rooms) * 100}%` }}></div>
              </div>
            </div>
            <Link href="/dashboard/rooms" className="block mt-4 text-center text-primary-600 text-sm font-medium hover:underline">
              Manage Rooms →
            </Link>
          </div>

          {/* Upcoming */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold mb-4">Upcoming</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CalendarCheck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">3 Check-ins Today</p>
                  <p className="text-sm text-gray-500">Next: Room 205 at 2 PM</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CalendarX className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium">2 Check-outs Today</p>
                  <p className="text-sm text-gray-500">Next: Room 102 at 12 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, trend, trendUp, icon: Icon, color }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${
          trendUp ? 'text-green-600' : 'text-orange-600'
        }`}>
          {trendUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          {trend}
        </div>
      </div>
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  )
}

function QuickActionButton({ href, label, color }: any) {
  return (
    <Link
      href={href}
      className={`${color} p-4 rounded-xl text-center font-medium hover:opacity-80 transition`}
    >
      {label}
    </Link>
  )
}

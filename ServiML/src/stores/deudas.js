import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabaseClient.js' 

export function useDeudas() {
  const Deudas = ref([])
  const loading = ref(false)

  const fetchRecentNotifications = async () => {
    loading.value = true
    const { data, error } = await supabase
      .from('notificaciones_deudas')
      .select(`
        *,
        deudas ( nombre ) 
      `)
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (data) Deudas.value = data
    loading.value = false
  }
  
  const handleNewNotification = async (payload) => {
    const newNotif = payload.new
    
    if (newNotif.deuda) {
       const { data } = await supabase.from('deudas').select('nombre').eq('id', newNotif.deuda).single()
       newNotif.deudas = data
    }

    Deudas.value.unshift(newNotif)
  }

  const markAsReadDeuda = async (id) => {
    const notif = Deudas.value.find(n => n.id === id)
    if (notif) notif.leido = true

    const { error } = await supabase
      .from('notificaciones_deudas')
      .update({ leido: true })
      .eq('id', id)

    if (error && notif) notif.leido = false
  }

  const markAllAsReadDeuda = async () => {
    const unreadIds = Deudas.value.filter(n => !n.leido).map(n => n.id)
    if (unreadIds.length === 0) return

    Deudas.value.forEach(n => { n.leido = true })

    const { error } = await supabase
      .from('notificaciones_deudas')
      .update({ leido: true })
      .in('id', unreadIds)

    if (error) {
       fetchRecentNotifications()
    }
  }

  let channel

  onMounted(() => {
    fetchRecentNotifications()
    
    channel = supabase
      .channel('realtime:system_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificaciones_deudas'
        },
        handleNewNotification
      )
      .subscribe()
  })

  onUnmounted(() => {
    if (channel) supabase.removeChannel(channel)
  })

  return {
    Deudas,
    loading,
    markAsReadDeuda,
    markAllAsReadDeuda
  }
}
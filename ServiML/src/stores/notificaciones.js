import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabaseClient.js' 

export function useNotifications(currentUserId) {
  const notifications = ref([])

  const fetchRecentNotifications = async () => {
    const { data, error } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('id_empleado', currentUserId)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (data) notifications.value = data
    console.log(notifications.value)
  }

  const handleNewNotification = (payload) => {
    notifications.value.unshift(payload.new)
    console.log('Alerta visual:', payload.new.titulo)
  }

  const markAsRead = async (id) => {
    const { error } = await supabase
      .from('notificaciones')
      .update({ leido: true })
      .eq('id', id)

    if (!error) {
      const notif = notifications.value.find(n => n.id === id)
      if (notif) notif.leido = true
    }
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications.value.filter(n => !n.leido).map(n => n.id)
    if (unreadIds.length === 0) return

    const { error } = await supabase
      .from('notificaciones')
      .update({ leido: true })
      .in('id', unreadIds)

    if (!error) {
      notifications.value.forEach(n => { n.leido = true })
    }
  }

  let channel

  onMounted(() => {
    fetchRecentNotifications()
    channel = supabase
      .channel('realtime:notificaciones')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificaciones',
          filter: `id_empleado=eq.${currentUserId}`
        },
        handleNewNotification
      )
      .subscribe()
  })

  onUnmounted(() => {
    if (channel) supabase.removeChannel(channel)
  })

  return {
    notifications,
    markAsRead,
    markAllAsRead
  }
}
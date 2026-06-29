const copy = {
  fr: {
    unread: 'non lue', unreadPlural: 'non lues', caughtUp: 'Vous êtes à jour', markAll: 'Tout marquer comme lu', close: 'Fermer les notifications', all: 'Toutes', unreadTab: 'Non lues', loading: 'Chargement des notifications', filter: 'Filtrer les notifications', panel: 'Panneau des notifications', noneUnread: 'Aucune notification non lue', none: 'Aucune notification pour le moment', emptyHint: 'Les nouvelles demandes et mises à jour apparaîtront ici.', generic: 'Vous avez une nouvelle notification.', reservation: 'Nouvelle demande', status: 'Mise à jour de réservation', completion: 'Confirmation requise', dispute: 'Litige', booking: 'Réservation', newRequest: ({ equipment, person, start, end }) => `Nouvelle demande pour « ${equipment} » par ${person}${start && end ? `, du ${start} au ${end}` : ''}.`, statusUpdate: ({ equipment, status }) => `La réservation${equipment ? ` de « ${equipment} »` : ''} est maintenant ${status}.`, completionRequest: ({ equipment }) => `Le propriétaire a marqué${equipment ? ` « ${equipment} »` : ' la réservation'} comme terminée. Confirmez la fin ou signalez un problème.`, statuses: { requested:'demandée',owner_accepted:'acceptée par le propriétaire',awaiting_payment:'en attente de paiement',payment_submitted:'paiement envoyé',scheduled:'planifiée',in_progress:'en cours',owner_completed:'marquée comme terminée',paid:'payée',active:'active',completed:'terminée',cancelled:'annulée',disputed:'en litige',rejected:'refusée',pending:'en attente' }
  },
  en: {
    unread:'unread',unreadPlural:'unread',caughtUp:'All caught up',markAll:'Mark all read',close:'Close notifications',all:'All',unreadTab:'Unread',loading:'Loading notifications',filter:'Notification filter',panel:'Notifications panel',noneUnread:'No unread notifications',none:'No notifications yet',emptyHint:'New requests and booking updates will appear here.',generic:'You have a new notification.',reservation:'New request',status:'Booking update',completion:'Confirmation required',dispute:'Dispute',booking:'Booking',newRequest:({equipment,person,start,end})=>`New request for “${equipment}” by ${person}${start&&end?`, from ${start} to ${end}`:''}.`,statusUpdate:({equipment,status})=>`Your booking${equipment?` for “${equipment}”`:''} is now ${status}.`,completionRequest:({equipment})=>`The owner marked${equipment?` “${equipment}”`:' the booking'} complete. Confirm completion or report a problem.`,statuses:{requested:'requested',owner_accepted:'owner accepted',awaiting_payment:'awaiting payment',payment_submitted:'payment submitted',scheduled:'scheduled',in_progress:'in progress',owner_completed:'marked complete',paid:'paid',active:'active',completed:'completed',cancelled:'cancelled',disputed:'disputed',rejected:'declined',pending:'pending'}
  },
  ar: {
    unread:'غير مقروء',unreadPlural:'غير مقروءة',caughtUp:'لا توجد تحديثات جديدة',markAll:'تحديد الكل كمقروء',close:'إغلاق الإشعارات',all:'الكل',unreadTab:'غير المقروءة',loading:'جارٍ تحميل الإشعارات',filter:'تصفية الإشعارات',panel:'لوحة الإشعارات',noneUnread:'لا توجد إشعارات غير مقروءة',none:'لا توجد إشعارات بعد',emptyHint:'ستظهر الطلبات الجديدة وتحديثات الحجوزات هنا.',generic:'لديك إشعار جديد.',reservation:'طلب جديد',status:'تحديث الحجز',completion:'التأكيد مطلوب',dispute:'نزاع',booking:'الحجز',newRequest:({equipment,person,start,end})=>`طلب جديد على «${equipment}» من ${person}${start&&end?`، من ${start} إلى ${end}`:''}.`,statusUpdate:({equipment,status})=>`أصبح الحجز${equipment?` الخاص بـ «${equipment}»`:''} ${status}.`,completionRequest:({equipment})=>`حدد المالك${equipment?` «${equipment}»`:' الحجز'} كمكتمل. أكد الانتهاء أو أبلغ عن مشكلة.`,statuses:{requested:'مطلوباً',owner_accepted:'مقبولاً من المالك',awaiting_payment:'في انتظار الدفع',payment_submitted:'تم إرسال دفعه',scheduled:'مجدولاً',in_progress:'قيد التنفيذ',owner_completed:'معلماً كمكتمل',paid:'مدفوعاً',active:'نشطاً',completed:'مكتملاً',cancelled:'ملغى',disputed:'محل نزاع',rejected:'مرفوضاً',pending:'قيد الانتظار'}
  }
};

const safeData = notification => notification?.data && typeof notification.data === 'object' ? notification.data : {};
const shortDate = (value, language) => value ? new Date(`${String(value).slice(0,10)}T00:00:00`).toLocaleDateString(language,{day:'numeric',month:'short'}) : '';

export const getNotificationCopy = language => copy[language] || copy.fr;

export const localizeNotification = (notification, language) => {
  const c=getNotificationCopy(language); const data=safeData(notification); const equipment=data.equipment_name || '';
  if(notification.type==='reservation') return c.newRequest({equipment:equipment||c.booking,person:data.reserved_by||'—',start:shortDate(data.start_date,language),end:shortDate(data.end_date,language)});
  if(notification.type==='reservation_status') return c.statusUpdate({equipment,status:c.statuses[data.status]||data.status||c.statuses.pending});
  if(notification.type==='completion_requested') return c.completionRequest({equipment});
  return language==='en' && notification.message ? notification.message : c.generic;
};

export const notificationTypeLabel = (type, language) => {
  const c=getNotificationCopy(language);
  return type==='reservation' ? c.reservation : type==='reservation_status' ? c.status : type==='completion_requested' ? c.completion : type==='dispute' ? c.dispute : c.booking;
};

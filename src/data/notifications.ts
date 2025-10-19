import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { employees } from './employees';

const actorSystem = { name: 'Hệ thống', avatar: 'https://picsum.photos/seed/11/40/40' };
const actorManager = { name: 'Trưởng phòng Marketing', avatar: 'https://picsum.photos/seed/10/40/40' };
const actorLVC = employees.find(e => e.id === 'emp-03')!;

export const notifications = [
  {
    id: 'notif-1',
    recipientId: 'emp-01', // Nguyễn Văn A
    type: 'assigned',
    title: 'KPI mới được giao',
    description: 'Bạn đã được giao KPI "Tăng 15% lượng khách hàng tiềm năng".',
    time: formatDistanceToNow(new Date(new Date().setDate(new Date().getDate() - 1)), { addSuffix: true, locale: vi }),
    read: false,
    actor: actorManager,
    target: 'Tăng 15% lượng khách hàng tiềm năng',
    action: 'đã giao cho bạn KPI:'
  },
  {
    id: 'notif-2',
    recipientId: 'all',
    type: 'reminder',
    title: 'Nhắc nhở hạn chót',
    description: 'KPI "Hoàn thành báo cáo thị trường" sẽ hết hạn trong 3 ngày.',
    time: formatDistanceToNow(new Date(new Date().setDate(new Date().getDate() - 2)), { addSuffix: true, locale: vi }),
    read: false,
    actor: actorSystem,
    target: '"Hoàn thành báo cáo thị trường"',
    action: 'nhắc nhở: KPI'
  },
  {
    id: 'notif-3',
    recipientId: 'emp-02', // Trần Thị B
    type: 'approved',
    title: 'KPI đã được duyệt',
    description: 'Chúc mừng! KPI "Đạt chứng chỉ Google Ads" của bạn đã được duyệt.',
    time: formatDistanceToNow(new Date(new Date().setDate(new Date().getDate() - 3)), { addSuffix: true, locale: vi }),
    read: true,
    actor: actorManager,
    target: '"Đạt chứng chỉ Google Ads"',
    action: 'đã duyệt KPI của bạn:'
  },
  {
    id: 'notif-4',
    recipientId: 'emp-03', // Lê Văn C
    type: 'rejected',
    title: 'KPI bị từ chối',
    description: 'KPI "Tối ưu hóa trang sản phẩm" đã bị từ chối với phản hồi.',
    time: formatDistanceToNow(new Date(new Date().setDate(new Date().getDate() - 4)), { addSuffix: true, locale: vi }),
    read: true,
    actor: actorManager,
    target: '"Tối ưu hóa trang sản phẩm"',
    action: 'đã từ chối KPI của bạn:'
  },
   {
    id: 'notif-5',
    recipientId: 'all',
    type: 'reward',
    title: 'Thưởng hiệu suất',
    description: 'Bạn đã nhận được thưởng cho việc hoàn thành xuất sắc KPI Quý 2.',
    time: formatDistanceToNow(new Date(new Date().setDate(new Date().getDate() - 7)), { addSuffix: true, locale: vi }),
    read: false,
    actor: actorSystem,
    target: 'Thưởng hiệu suất Quý 2',
    action: 'thông báo về'
  },
  {
    id: 'notif-6',
    recipientId: 'admin-01',
    type: 'assigned', // using assigned icon
    title: 'Yêu cầu duyệt KPI',
    description: 'Lê Văn C đã nộp KPI "Giảm 5% thời gian xử lý yêu cầu khách hàng".',
    time: formatDistanceToNow(new Date(new Date().setHours(new Date().getHours() - 2)), { addSuffix: true, locale: vi }),
    read: false,
    actor: actorLVC,
    target: '"Giảm 5% thời gian xử lý yêu cầu khách hàng"',
    action: 'đã nộp KPI để chờ duyệt:'
  }
];

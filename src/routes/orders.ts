import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { Order, OrderStatusHistory, User } from '../models';
import { Op } from 'sequelize';

const router = Router();

// Get all orders with filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      status,
      searchTerm,
      salespersonId,
      startDate,
      endDate
    } = req.query;

    const where: any = {};

    // Apply role-based filtering
    if (req.user?.role === 'sales') {
      where.salespersonId = req.user.id;
    } else if (req.user?.role === 'factory') {
      where.currentStatus = {
        [Op.notIn]: ['received', 'packed']
      };
    }

    // Apply status filter
    if (status && status !== 'all') {
      where.currentStatus = status;
    }

    // Apply search filter
    if (searchTerm) {
      where[Op.or] = [
        { sdyNumber: { [Op.like]: `%${searchTerm}%` } },
        { partyName: { [Op.like]: `%${searchTerm}%` } },
        { deliveryParty: { [Op.like]: `%${searchTerm}%` } }
      ];
    }

    // Apply salesperson filter
    if (salespersonId && salespersonId !== 'all') {
      where.salespersonId = salespersonId;
    }

    // Apply date range filter
    if (startDate) {
      where.date = {
        ...where.date,
        [Op.gte]: new Date(startDate as string)
      };
    }
    if (endDate) {
      where.date = {
        ...where.date,
        [Op.lte]: new Date(endDate as string)
      };
    }

    const orders = await Order.findAll({
      where,
      include: [
        {
          model: OrderStatusHistory,
          include: [{ model: User, attributes: ['id', 'username'] }],
          order: [['createdAt', 'DESC']]
        },
        {
          model: User,
          as: 'salesperson',
          attributes: ['id', 'username']
        }
      ],
      order: [['date', 'DESC']]
    });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Create new order
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      sdyNumber,
      date,
      partyName,
      deliveryParty,
      salespersonId,
      denier,
      slNumber
    } = req.body;

    // Validate required fields
    if (!sdyNumber || !date || !partyName || !deliveryParty || !salespersonId || !denier || !slNumber) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user has permission to create orders
    if (!req.user || !['admin', 'operator'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized to create orders' });
    }

    // Create order with initial status
    const order = await Order.create({
      sdyNumber,
      date,
      partyName,
      deliveryParty,
      salespersonId,
      denier,
      slNumber,
      currentStatus: 'received'
    });

    // Create initial status history entry
    await OrderStatusHistory.create({
      orderId: order.id,
      status: 'received',
      updatedBy: req.user.id
    });

    // Fetch the complete order with relations
    const completeOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderStatusHistory,
          include: [{ model: User, attributes: ['id', 'username'] }]
        },
        {
          model: User,
          as: 'salesperson',
          attributes: ['id', 'username']
        }
      ]
    });

    res.status(201).json(completeOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Update order status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if user has permission to update status
    const canUpdate = (() => {
      if (req.user.role === 'admin') return true;
      if (req.user.role === 'factory') {
        return order.currentStatus !== 'received' && order.currentStatus !== 'packed';
      }
      if (req.user.role === 'operator') {
        return order.currentStatus === 'received';
      }
      return false;
    })();

    if (!canUpdate) {
      return res.status(403).json({ error: 'Not authorized to update order status' });
    }

    // Update order status
    await order.update({ currentStatus: status });

    // Create status history entry
    await OrderStatusHistory.create({
      orderId: order.id,
      status,
      updatedBy: req.user.id
    });

    // Fetch updated order with relations
    const updatedOrder = await Order.findByPk(id, {
      include: [
        {
          model: OrderStatusHistory,
          include: [{ model: User, attributes: ['id', 'username'] }],
          order: [['createdAt', 'DESC']]
        },
        {
          model: User,
          as: 'salesperson',
          attributes: ['id', 'username']
        }
      ]
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Get order details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const order = await Order.findByPk(id, {
      include: [
        {
          model: OrderStatusHistory,
          include: [{ model: User, attributes: ['id', 'username'] }],
          order: [['createdAt', 'DESC']]
        },
        {
          model: User,
          as: 'salesperson',
          attributes: ['id', 'username']
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if user has permission to view this order
    if (req.user.role === 'sales' && order.salespersonId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this order' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

export default router; 
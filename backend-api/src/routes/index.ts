import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import restaurantRoutes from './restaurant.routes';
import menuRoutes from './menu.routes';
import inventoryRoutes from './inventory.routes';
import analyticsRoutes from './analytics.routes';
import agentRoutes from './agent.routes';
import sessionRoutes from './session.routes';
import ingestRoutes from './ingest.routes';
import searchRoutes from './search.routes';
import announcementRoutes from './announcement.routes';
import knowledgeRoutes from './knowledge.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/menu', menuRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/agents', agentRoutes);
router.use('/sessions', sessionRoutes);
router.use('/ingest', ingestRoutes);
router.use('/search', searchRoutes);
router.use('/announcements', announcementRoutes);
router.use('/knowledge', knowledgeRoutes);

export default router;

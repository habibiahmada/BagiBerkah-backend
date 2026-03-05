import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';

const router: ExpressRouter = Router();
const controller = new AnalyticsController();

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get comprehensive dashboard data
 * @access  Public (should be protected in production)
 */
router.get('/dashboard', controller.getDashboard);

/**
 * @route   GET /api/analytics/envelopes
 * @desc    Get envelope statistics
 * @access  Public
 */
router.get('/envelopes', controller.getEnvelopeStats);

/**
 * @route   GET /api/analytics/payments
 * @desc    Get payment statistics
 * @access  Public
 */
router.get('/payments', controller.getPaymentStats);

/**
 * @route   GET /api/analytics/distribution
 * @desc    Get distribution mode statistics
 * @access  Public
 */
router.get('/distribution', controller.getDistributionStats);

/**
 * @route   GET /api/analytics/activity
 * @desc    Get recent activity
 * @access  Public
 * @query   limit - Number of items to return (default: 10)
 */
router.get('/activity', controller.getRecentActivity);

export default router;

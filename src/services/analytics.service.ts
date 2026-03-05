import prisma from '../config/database';

export class AnalyticsService {
  /**
   * Get envelope statistics
   */
  async getEnvelopeStats() {
    const totalEnvelopes = await prisma.envelope.count();
    
    const activeEnvelopes = await prisma.envelope.count({
      where: { status: 'ACTIVE' },
    });

    const completedEnvelopes = await prisma.envelope.count({
      where: { status: 'COMPLETED' },
    });

    const totalBudget = await prisma.envelope.aggregate({
      _sum: { totalBudget: true },
    });

    const totalRecipients = await prisma.recipient.count();

    const claimedRecipients = await prisma.claim.count({
      where: {
        status: {
          in: ['CLAIMED', 'VALIDATED'],
        },
      },
    });

    return {
      totalEnvelopes,
      activeEnvelopes,
      completedEnvelopes,
      totalBudget: totalBudget._sum.totalBudget || 0,
      totalRecipients,
      claimedRecipients,
      claimRate: totalRecipients > 0 
        ? ((claimedRecipients / totalRecipients) * 100).toFixed(2) 
        : '0',
    };
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats() {
    const totalPayments = await prisma.payment.count();
    
    const successfulPayments = await prisma.payment.count({
      where: { status: 'SUCCESS' },
    });

    const pendingPayments = await prisma.payment.count({
      where: { status: 'PENDING' },
    });

    const failedPayments = await prisma.payment.count({
      where: { status: 'FAILED' },
    });

    const totalAmount = await prisma.payment.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { amount: true },
    });

    return {
      totalPayments,
      successfulPayments,
      pendingPayments,
      failedPayments,
      totalAmount: totalAmount._sum.amount || 0,
      successRate: totalPayments > 0 
        ? ((successfulPayments / totalPayments) * 100).toFixed(2) 
        : '0',
    };
  }

  /**
   * Get distribution mode statistics
   */
  async getDistributionStats() {
    const digitalCount = await prisma.envelope.count({
      where: { distributionMode: 'DIGITAL' },
    });

    const cashCount = await prisma.envelope.count({
      where: { distributionMode: 'CASH' },
    });

    return {
      digital: digitalCount,
      cash: cashCount,
      total: digitalCount + cashCount,
      digitalPercentage: (digitalCount + cashCount) > 0 
        ? ((digitalCount / (digitalCount + cashCount)) * 100).toFixed(2) 
        : '0',
    };
  }

  /**
   * Get recent activity
   */
  async getRecentActivity(limit: number = 10) {
    const recentEnvelopes = await prisma.envelope.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        envelopeName: true,
        totalBudget: true,
        distributionMode: true,
        status: true,
        createdAt: true,
        _count: {
          select: { recipients: true },
        },
      },
    });

    const recentClaims = await prisma.claim.findMany({
      where: {
        status: {
          in: ['CLAIMED', 'VALIDATED'],
        },
      },
      orderBy: { claimedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        status: true,
        claimedAt: true,
        recipient: {
          select: {
            name: true,
            allocatedAmount: true,
          },
        },
      },
    });

    return {
      recentEnvelopes,
      recentClaims,
    };
  }

  /**
   * Get age level distribution
   */
  async getAgeLevelDistribution() {
    const distribution = await prisma.recipient.groupBy({
      by: ['ageLevel'],
      _count: true,
      _sum: {
        allocatedAmount: true,
      },
    });

    return distribution.map((item) => ({
      ageLevel: item.ageLevel,
      count: item._count,
      totalAmount: item._sum.allocatedAmount || 0,
    }));
  }

  /**
   * Get comprehensive dashboard data
   */
  async getDashboardData() {
    const [
      envelopeStats,
      paymentStats,
      distributionStats,
      recentActivity,
      ageLevelDistribution,
    ] = await Promise.all([
      this.getEnvelopeStats(),
      this.getPaymentStats(),
      this.getDistributionStats(),
      this.getRecentActivity(5),
      this.getAgeLevelDistribution(),
    ]);

    return {
      envelopeStats,
      paymentStats,
      distributionStats,
      recentActivity,
      ageLevelDistribution,
      generatedAt: new Date().toISOString(),
    };
  }
}

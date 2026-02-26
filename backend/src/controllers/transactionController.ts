import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getTransactions = async (req: Request, res: Response) => {
  const { page = 1, limit = 20, type, category, startDate, endDate } = req.query;
  const userId = (req as any).userId;
  const where: any = { userId };
  if (type) where.type = type;
  if (category) where.category = category;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(String(startDate));
    if (endDate) where.date.lte = new Date(String(endDate));
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where, skip: (+page - 1) * +limit, take: +limit,
      orderBy: { date: 'desc' }
    }),
    prisma.transaction.count({ where })
  ]);

  res.json({ transactions, total, pages: Math.ceil(total / +limit) });
};

export const createTransaction = async (req: Request, res: Response) => {
  const { amount, description, type, category, date } = req.body;
  const t = await prisma.transaction.create({
    data: { amount: +amount, description, type, category, date: date ? new Date(date) : new Date(), userId: (req as any).userId }
  });
  res.status(201).json(t);
};

export const deleteTransaction = async (req: Request, res: Response) => {
  await prisma.transaction.delete({ where: { id: +req.params.id } });
  res.json({ message: 'Deleted' });
};

export const getSummary = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalIncome, totalExpense, monthlyIncome, monthlyExpense, byCategory] = await Promise.all([
    prisma.transaction.aggregate({ where: { userId, type: 'income' }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { userId, type: 'expense' }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { userId, type: 'income', date: { gte: startOfMonth } }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { userId, type: 'expense', date: { gte: startOfMonth } }, _sum: { amount: true } }),
    prisma.transaction.groupBy({
      by: ['category', 'type'], where: { userId, date: { gte: startOfMonth } },
      _sum: { amount: true }
    })
  ]);

  res.json({
    totalBalance: (totalIncome._sum.amount || 0) - (totalExpense._sum.amount || 0),
    monthlyIncome: monthlyIncome._sum.amount || 0,
    monthlyExpense: monthlyExpense._sum.amount || 0,
    byCategory
  });
};

export const getMonthlyTrend = async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return { year: d.getFullYear(), month: d.getMonth() + 1, start: new Date(d.getFullYear(), d.getMonth(), 1), end: new Date(d.getFullYear(), d.getMonth() + 1, 0) };
  }).reverse();

  const trend = await Promise.all(months.map(async ({ year, month, start, end }) => {
    const [income, expense] = await Promise.all([
      prisma.transaction.aggregate({ where: { userId, type: 'income', date: { gte: start, lte: end } }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { userId, type: 'expense', date: { gte: start, lte: end } }, _sum: { amount: true } }),
    ]);
    return { year, month, income: income._sum.amount || 0, expense: expense._sum.amount || 0 };
  }));

  res.json(trend);
};

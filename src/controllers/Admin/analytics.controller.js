import Ticket from "../../models/ticket.model.js";
import User from "../../models/User.model.js";


const getDateFilter = (range = "weekly") => {
  const now = new Date();
  let start = new Date();

  if (range === "weekly") start.setDate(now.getDate() - 7);
  if (range === "monthly") start.setMonth(now.getMonth() - 1);

  return { date: { $gte: start, $lte: now } };
};

export const getMetrics = async (req, res) => {
  try {
    const range = req.query.range || "weekly";
    const filter = getDateFilter(range);

    const totalTickets = await Ticket.countDocuments(filter);

    const agg = await Ticket.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amountSpent" },
          avgPayout: { $avg: "$payoutPercent" },
          avgGames: {
            $avg: { $subtract: ["$lastGameNo", "$firstGameNo"] },
          },
        },
      },
    ]);

    const totalAmount = agg[0]?.totalAmount || 0;
    const avgPayout = agg[0]?.avgPayout || 0;
    const avgGames = agg[0]?.avgGames || 0;

    res.json({
      metricData: [
        {
          title: "Total Tickets",
          value: totalTickets.toLocaleString(),
          subtext: range === "monthly" ? "/ This Month" : "/ This Week",
          trend: "+0%",
          info: {
            "Total Tickets": totalTickets.toLocaleString(),
            "Total Amount": totalAmount.toLocaleString(),
            "Avg Payout %": `${avgPayout.toFixed(2)}%`,
            "Avg Games": Math.round(avgGames).toString(),
          },
        },
      ],
    });
  } catch (err) {
    res.status(500).json({ message: "Metrics API error" });
  }
};
// 2️⃣ Automation Rate
export const getAutomationRate = async (req, res) => {
  try {
    const filter = getDateFilter(req.query.range);

    const total = await Ticket.countDocuments(filter);
    const bot = await Ticket.countDocuments({ ...filter, isBot: true });

    res.json({
      bot: Math.round((bot / total) * 100),
      human: Math.round(((total - bot) / total) * 100),
      totalQueries: total,
    });
  } catch {
    res.status(500).json({ message: "Automation rate error" });
  }
};

// 3️⃣ Escalation Rate
export const getEscalationRate = async (req, res) => {
  try {
    const filter = getDateFilter(req.query.range);

    const total = await Ticket.countDocuments(filter);
    const escalated = await Ticket.countDocuments({
      ...filter,
      isEscalated: true,
    });

    res.json({
      escalated: Math.round((escalated / total) * 100),
      nonEscalated: Math.round(((total - escalated) / total) * 100),
      totalQueries: total,
    });
  } catch {
    res.status(500).json({ message: "Escalation rate error" });
  }
};

// 4️⃣ First Response Time (Line Chart)
export const getFRT = async (req, res) => {
  try {
    const filter = getDateFilter(req.query.range);

    const data = await Ticket.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { $week: "$createdAt" },
          bot: {
            $avg: { $cond: ["$isBot", "$firstResponseTime", null] },
          },
          humans: {
            $avg: { $cond: ["$isBot", null, "$firstResponseTime"] },
          },
        },
      },
      { $sort: { "_id": 1 } },
    ]);

    res.json(
      data.map((d, i) => ({
        week: `Week${i + 1}`,
        bot: Number(d.bot?.toFixed(2) || 0),
        humans: Number(d.humans?.toFixed(2) || 0),
      }))
    );
  } catch {
    res.status(500).json({ message: "FRT error" });
  }
};

// 5️⃣ Resolution Time
export const getResolutionTime = async (req, res) => {
  try {
    const filter = getDateFilter(req.query.range || "weekly");

    const result = await Ticket.aggregate([
      {
        $match: {
          ...filter,
          status: "resolved",
          resolvedAt: { $exists: true },
        },
      },
      {
        $project: {
          resolutionMinutes: {
            $divide: [
              { $subtract: ["$resolvedAt", "$createdAt"] },
              1000 * 60,
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgMinutes: { $avg: "$resolutionMinutes" },
        },
      },
    ]);

    const minutes = Math.round(result[0]?.avgMinutes || 0);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    res.json({
      label: "Average Resolution Time",
      range: "this_week",
      value: `${hours}Hrs ${mins}Mins`,
      minutes,
    });
  } catch (err) {
    res.status(500).json({ message: "Resolution time error" });
  }
};


// 6️⃣ Agents Table
export const getAgents = async (req, res) => {
  try {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const agents = await User.find({ role: "agent" });

    const data = await Promise.all(
      agents.map(async (agent) => {
        const totalTickets = await Ticket.countDocuments({
          assignedTo: agent._id,
          createdAt: { $gte: startOfWeek },
        });

        return {
          name: agent.name,
          department: agent.department,
          totalTickets,
          avatar: agent.avatar || "",
        };
      })
    );

    res.json({
      week: "current",
      totalAgents: data.length,
      data,
    });
  } catch (error) {
    res.status(500).json({ message: "Agents error" });
  }
};


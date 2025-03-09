import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Grid,
  LinearProgress,
  Tabs,
  Tab
} from '@mui/material';
import { Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
} from 'chart.js';
import { useTheme } from '@mui/material/styles';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
);

export default function Dashboard({ stats }) {
  const [timeRange, setTimeRange] = useState('today');
  const [productivityScore, setProductivityScore] = useState(0);
  const [categoryStats, setCategoryStats] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    // Load productivity score
    chrome.storage.local.get(['productivityScore'], (result) => {
      setProductivityScore(result.productivityScore || 0);
    });

    // Load category stats
    chrome.storage.local.get(['categoryTracking'], (result) => {
      if (result.categoryTracking) {
        const today = new Date().toISOString().split('T')[0];
        setCategoryStats(result.categoryTracking[today]);
      }
    });

    // Load trend data for the last 7 days
    loadTrendData();
  }, []);

  const loadTrendData = () => {
    chrome.storage.local.get(['timeTracking', 'categoryTracking'], (result) => {
      const dates = getLast7Days();
      const productiveData = [];
      const distractingData = [];

      dates.forEach(date => {
        const categories = result.categoryTracking?.[date] || { productive: 0, distracting: 0 };
        productiveData.push(Math.round(categories.productive / 1000 / 60));
        distractingData.push(Math.round(categories.distracting / 1000 / 60));
      });

      setTrendData({
        labels: dates.map(date => new Date(date).toLocaleDateString()),
        datasets: [
          {
            label: 'Productive Time (min)',
            data: productiveData,
            borderColor: theme.palette.primary.main,
            backgroundColor: theme.palette.primary.light,
            borderWidth: 2,
            pointBackgroundColor: theme.palette.primary.main,
            pointBorderColor: theme.palette.primary.main,
            pointHoverBackgroundColor: theme.palette.primary.dark,
            pointHoverBorderColor: theme.palette.primary.dark,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: false,
            tension: 0.1
          },
          {
            label: 'Distracting Time (min)',
            data: distractingData,
            borderColor: theme.palette.secondary.main,
            backgroundColor: theme.palette.secondary.light,
            borderWidth: 2,
            pointBackgroundColor: theme.palette.secondary.main,
            pointBorderColor: theme.palette.secondary.main,
            pointHoverBackgroundColor: theme.palette.secondary.dark,
            pointHoverBorderColor: theme.palette.secondary.dark,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: false,
            tension: 0.1
          }
        ]
      });
    });
  };

  const getLast7Days = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  if (!stats || !categoryStats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Initialize default values for category stats
  const defaultCategoryStats = {
    productive: 0,
    neutral: 0,
    distracting: 0
  };

  const totalTime = Object.values(stats).reduce((a, b) => a + b, 0);
  const safeCategories = { ...defaultCategoryStats, ...categoryStats };

  const pieData = {
    labels: Object.keys(stats),
    datasets: [
      {
        data: Object.values(stats).map(time => Math.round(time / 1000 / 60)),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF'
        ]
      }
    ]
  };

  const pieOptions = {
    plugins: {
      legend: {
        position: 'bottom',
        display: false
      }
    }
  };

  const getProductivityColor = (score) => {
    if (score >= 70) return '#4caf50';
    if (score >= 40) return '#ff9800';
    return '#f44336';
  };

  return (
    <Box>
      <Grid container spacing={2}>
        {/* Productivity Score */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Productivity Score
            </Typography>
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <CircularProgress
                variant="determinate"
                value={productivityScore}
                size={80}
                thickness={4}
                sx={{
                  color: getProductivityColor(productivityScore),
                  circle: {
                    strokeLinecap: 'round'
                  }
                }}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography variant="h6" component="div">
                  {productivityScore}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Time Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Today's Activity
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Total time: {Math.round(totalTime / 1000 / 60)} minutes
            </Typography>
            <Box sx={{ height: '200px' }}>
              <Pie data={pieData} options={pieOptions} />
            </Box>
          </Paper>
        </Grid>

        {/* Category Stats */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Time Categories
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Productive
              </Typography>
              <LinearProgress
                variant="determinate"
                value={totalTime > 0 ? (safeCategories.productive / totalTime) * 100 : 0}
                sx={{ mb: 1, backgroundColor: '#e8f5e9', '& .MuiLinearProgress-bar': { backgroundColor: '#4caf50' } }}
              />
              <Typography variant="body2" gutterBottom>
                Neutral
              </Typography>
              <LinearProgress
                variant="determinate"
                value={totalTime > 0 ? (safeCategories.neutral / totalTime) * 100 : 0}
                sx={{ mb: 1, backgroundColor: '#e3f2fd', '& .MuiLinearProgress-bar': { backgroundColor: '#2196f3' } }}
              />
              <Typography variant="body2" gutterBottom>
                Distracting
              </Typography>
              <LinearProgress
                variant="determinate"
                value={totalTime > 0 ? (safeCategories.distracting / totalTime) * 100 : 0}
                sx={{ mb: 1, backgroundColor: '#ffebee', '& .MuiLinearProgress-bar': { backgroundColor: '#f44336' } }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Productivity Trend */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              7-Day Trend
            </Typography>
            {trendData && (
              <Box sx={{ height: '200px' }}>
                <Line
                  data={trendData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: true,
                        position: 'top',
                        labels: {
                          usePointStyle: true,
                          pointStyle: 'circle',
                          padding: 15,
                          color: theme.palette.text.primary
                        }
                      },
                      tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: theme.palette.background.paper,
                        titleColor: theme.palette.text.primary,
                        bodyColor: theme.palette.text.secondary,
                        borderColor: theme.palette.divider,
                        borderWidth: 1,
                        padding: 10,
                        displayColors: true,
                        callbacks: {
                          title: (tooltipItems) => {
                            return tooltipItems[0].label;
                          },
                          label: (context) => {
                            return `${context.dataset.label}: ${context.parsed.y} min`;
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Minutes',
                          color: theme.palette.text.secondary
                        },
                        grid: {
                          color: theme.palette.divider,
                          drawBorder: false
                        },
                        ticks: {
                          color: theme.palette.text.secondary
                        }
                      },
                      x: {
                        grid: {
                          color: theme.palette.divider,
                          drawBorder: false
                        },
                        ticks: {
                          color: theme.palette.text.secondary
                        }
                      }
                    },
                    interaction: {
                      mode: 'nearest',
                      axis: 'x',
                      intersect: false
                    }
                  }}
                />
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 
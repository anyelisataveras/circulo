import { useTranslation } from 'react-i18next';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, FolderOpen, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { t } = useTranslation();

  const { data: opportunities, isLoading: opportunitiesLoading, error: opportunitiesError } = trpc.grantOpportunities.list.useQuery(
    { limit: 5 },
    {
      retry: 2,
      retryDelay: 1000,
      onError: (error) => {
        console.error('[Dashboard] Failed to load grant opportunities:', error);
      },
    }
  );
  const { data: applications, isLoading: applicationsLoading, error: applicationsError } = trpc.applications.list.useQuery(
    {},
    {
      retry: 2,
      retryDelay: 1000,
      onError: (error) => {
        console.error('[Dashboard] Failed to load applications:', error);
      },
    }
  );
  const { data: upcomingDeadlines, isLoading: deadlinesLoading, error: deadlinesError } = trpc.grantOpportunities.upcomingDeadlines.useQuery(
    { daysAhead: 30 },
    {
      retry: 2,
      retryDelay: 1000,
      onError: (error) => {
        console.error('[Dashboard] Failed to load upcoming deadlines:', error);
      },
    }
  );

  const stats = [
    {
      title: t('dashboard.stats.activeOpportunities'),
      value: opportunities?.filter(o => o.status === 'monitoring' || o.status === 'preparing').length || 0,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: t('dashboard.stats.applicationsInProgress'),
      value: applications?.filter(a => a.status === 'draft' || a.status === 'in_review').length || 0,
      icon: FolderOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: t('dashboard.stats.submittedApplications'),
      value: applications?.filter(a => a.status === 'submitted').length || 0,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: t('dashboard.stats.awardedGrants'),
      value: applications?.filter(a => a.status === 'awarded').length || 0,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];

  return (
    <div className="space-y-6" role="region" aria-label="Dashboard overview">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground mt-2">{t('dashboard.welcome')}</p>
      </header>

      {/* Stats Grid */}
      <section aria-label="Key statistics" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" role="region" aria-label="Recent activity">
        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              {t('dashboard.upcomingDeadlines.title')}
            </CardTitle>
            <CardDescription>{t('dashboard.upcomingDeadlines.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {deadlinesError ? (
              <div className="text-center py-8">
                <p className="text-sm text-red-600 mb-2">Failed to load upcoming deadlines</p>
                <p className="text-xs text-muted-foreground">{deadlinesError.message}</p>
              </div>
            ) : deadlinesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : upcomingDeadlines && upcomingDeadlines.length > 0 ? (
              <div className="space-y-3">
                {upcomingDeadlines.slice(0, 5).map((opportunity) => {
                  const daysUntil = Math.ceil(
                    (new Date(opportunity.applicationDeadline).getTime() - new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div
                      key={opportunity.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{opportunity.programTitle}</p>
                        <p className="text-sm text-muted-foreground">{opportunity.fundingSource}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className={`text-sm font-semibold ${daysUntil <= 7 ? 'text-red-600' : 'text-orange-600'}`}>
                          {daysUntil} days
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(opportunity.applicationDeadline).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t('dashboard.upcomingDeadlines.noDeadlines')}
              </p>
            )}
            <Link href="/opportunities">
              <Button variant="outline" className="w-full mt-4">
                {t('dashboard.upcomingDeadlines.viewAll')}
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.recentApplications.title')}</CardTitle>
            <CardDescription>{t('dashboard.recentApplications.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {applicationsError ? (
              <div className="text-center py-8">
                <p className="text-sm text-red-600 mb-2">Failed to load applications</p>
                <p className="text-xs text-muted-foreground">{applicationsError.message}</p>
              </div>
            ) : applicationsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : applications && applications.length > 0 ? (
              <div className="space-y-3">
                {applications.slice(0, 5).map((application) => {
                  const statusColors = {
                    draft: 'bg-gray-100 text-gray-700',
                    in_review: 'bg-blue-100 text-blue-700',
                    submitted: 'bg-purple-100 text-purple-700',
                    awarded: 'bg-green-100 text-green-700',
                    rejected: 'bg-red-100 text-red-700',
                    withdrawn: 'bg-gray-100 text-gray-700',
                  };
                  return (
                    <div
                      key={application.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{application.projectTitle}</p>
                        <p className="text-sm text-muted-foreground">
                          {application.requestedAmount
                            ? `€${(application.requestedAmount / 100).toLocaleString()}`
                            : 'Amount TBD'}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          statusColors[application.status]
                        }`}
                      >
                        {application.status.replace('_', ' ')}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t('dashboard.recentApplications.noApplications')}
              </p>
            )}
            <Link href="/applications">
              <Button variant="outline" className="w-full mt-4">
                {t('dashboard.recentApplications.viewAll')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <section aria-label="Quick actions">
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.quickActions.title')}</CardTitle>
          <CardDescription>{t('dashboard.quickActions.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/opportunities">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-start">
                <FileText className="h-5 w-5 mb-2" />
                <span className="font-semibold">{t('dashboard.quickActions.addOpportunity')}</span>
                <span className="text-xs text-muted-foreground mt-1">
                  {t('dashboard.quickActions.addOpportunityDesc')}
                </span>
              </Button>
            </Link>
            <Link href="/applications">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-start">
                <FolderOpen className="h-5 w-5 mb-2" />
                <span className="font-semibold">{t('dashboard.quickActions.createApplication')}</span>
                <span className="text-xs text-muted-foreground mt-1">
                  {t('dashboard.quickActions.createApplicationDesc')}
                </span>
              </Button>
            </Link>
            <Link href="/reports">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-start">
                <CheckCircle2 className="h-5 w-5 mb-2" />
                <span className="font-semibold">{t('dashboard.quickActions.generateReport')}</span>
                <span className="text-xs text-muted-foreground mt-1">
                  {t('dashboard.quickActions.generateReportDesc')}
                </span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      </section>
    </div>
  );
}

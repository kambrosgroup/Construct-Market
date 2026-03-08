import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { useAuth, API } from '../../App';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Star, ThumbsUp } from 'lucide-react';
import axios from 'axios';

export default function ProviderRatings() {
  const { user } = useAuth();
  const [ratings, setRatings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRatings();
  }, [user]);

  const fetchRatings = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const [ratingsRes, summaryRes] = await Promise.all([
        axios.get(`${API}/ratings`, { withCredentials: true, headers }),
        axios.get(`${API}/ratings/provider/${user?.company_id}/summary`, { withCredentials: true, headers }).catch(() => ({ data: null }))
      ]);
      
      setRatings(ratingsRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Failed to fetch ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (score) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= score ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout title="Ratings">
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Your Ratings</h2>
          <p className="text-muted-foreground">See what clients are saying about your work</p>
        </div>

        {/* Summary Card */}
        {summary && summary.total_ratings > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border bg-primary/5">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="h-8 w-8 fill-amber-400 text-amber-400" />
                  <span className="text-4xl font-heading font-bold text-foreground">
                    {summary.average_score?.toFixed(1)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Overall Rating</p>
                <p className="text-xs text-muted-foreground mt-1">{summary.total_ratings} reviews</p>
              </CardContent>
            </Card>

            <Card className="border">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-2">Quality</p>
                <div className="flex items-center gap-2">
                  {renderStars(Math.round(summary.average_quality))}
                  <span className="font-semibold">{summary.average_quality?.toFixed(1)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-2">Punctuality</p>
                <div className="flex items-center gap-2">
                  {renderStars(Math.round(summary.average_punctuality))}
                  <span className="font-semibold">{summary.average_punctuality?.toFixed(1)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-2">Would Rehire</p>
                <div className="flex items-center gap-2">
                  <ThumbsUp className="h-5 w-5 text-green-600" />
                  <span className="text-2xl font-heading font-bold text-green-600">
                    {summary.rehire_percentage?.toFixed(0)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Ratings List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading ratings...</div>
        ) : ratings.length === 0 ? (
          <Card className="border">
            <CardContent className="py-12 text-center">
              <Star className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No ratings yet</p>
              <p className="text-sm text-muted-foreground mt-1">Complete contracts to receive ratings from clients</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {ratings.map((rating) => (
              <Card key={rating.rating_id} className="border">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {renderStars(rating.score)}
                        <span className="font-semibold text-lg">{rating.score}/5</span>
                        {rating.would_rehire && (
                          <Badge className="bg-green-100 text-green-700">Would Rehire</Badge>
                        )}
                      </div>
                      {rating.comment && (
                        <p className="text-foreground mb-3">"{rating.comment}"</p>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Quality</p>
                          <div className="flex items-center gap-1">
                            {renderStars(rating.quality)}
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Punctuality</p>
                          <div className="flex items-center gap-1">
                            {renderStars(rating.punctuality)}
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Communication</p>
                          <div className="flex items-center gap-1">
                            {renderStars(rating.communication)}
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Safety</p>
                          <div className="flex items-center gap-1">
                            {renderStars(rating.safety)}
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Value</p>
                          <div className="flex items-center gap-1">
                            {renderStars(rating.value)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p>by {rating.rater_name}</p>
                      <p>{new Date(rating.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

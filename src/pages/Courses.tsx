import React, { useState, useEffect } from 'react';
import { Search, GraduationCap, Code } from 'lucide-react';
import { getLocalCourses, getLocalCategories } from '../lib/localDatabase';
import type { Course, Category } from '../lib/localDatabase';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

interface CoursesProps {
  isDemo: boolean;
  refreshTrigger: number;
}

export const Courses: React.FC<CoursesProps> = ({ isDemo, refreshTrigger }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchCatalogData = async () => {
    setIsLoading(true);
    if (!isDemo && isSupabaseConfigured() && supabase) {
      try {
        const { data: catData } = await supabase.from('categories').select('*');
        const { data: courseData } = await supabase.from('courses').select('*').eq('active', true);
        
        if (catData) setCategories(catData);
        if (courseData) setCourses(courseData);
      } catch (err) {
        console.error('Failed to load from Supabase catalog, loading local:', err);
        setCategories(getLocalCategories());
        setCourses(getLocalCourses());
      }
    } else {
      setCategories(getLocalCategories());
      setCourses(getLocalCourses());
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCatalogData();
  }, [isDemo, refreshTrigger]);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = 
      course.name.toLowerCase().includes(search.toLowerCase()) ||
      course.description.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = 
      activeCategory === 'all' || 
      course.category_id === activeCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="courses-container">
      {/* Search and Filters Header */}
      <div 
        className="glass-card" 
        style={{ 
          display: 'flex', 
          flexWrap: 'wrap',
          gap: '16px', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setActiveCategory('all')} 
            className={`btn ${activeCategory === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          >
            All Offerings
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)} 
              className={`btn ${activeCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
            >
              {cat.name === 'Technologies' ? <Code size={14} /> : <GraduationCap size={14} />}
              {cat.name}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted))', display: 'flex', alignItems: 'center' }}>
            <Search size={16} />
          </span>
          <input 
            type="text" 
            placeholder="Search courses..." 
            className="form-input" 
            style={{ paddingLeft: '36px' }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'hsl(var(--muted))' }}>
          Loading course catalog...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {categories
            .filter(cat => activeCategory === 'all' || activeCategory === cat.id)
            .map(cat => {
              const catCourses = filteredCourses.filter(c => c.category_id === cat.id);
              if (catCourses.length === 0) return null;
              
              return (
                <div key={cat.id}>
                  <h3 className="courses-section-title">
                    {cat.name === 'Technologies' ? <Code size={18} /> : <GraduationCap size={18} />}
                    {cat.name} Courses ({catCourses.length})
                  </h3>
                  
                  <div className="courses-grid">
                    {catCourses.map(course => (
                      <div key={course.id} className="glass-card course-card">
                        <div>
                          <h4>{course.name}</h4>
                          <p>{course.description}</p>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid hsl(var(--card-border))', paddingTop: '12px' }}>
                          <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', fontWeight: 600, textTransform: 'uppercase' }}>Tuition Fee</span>
                          <span className="fee">{course.fee}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

          {filteredCourses.length === 0 && (
            <div className="glass-card" style={{ textAlign: 'center', padding: '48px', color: 'hsl(var(--muted))' }}>
              No course matches the selected search criteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default Courses;

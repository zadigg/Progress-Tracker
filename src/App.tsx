import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CheckCircle2, Circle, GraduationCap, Plus, Book, X, RepeatIcon as ReactIcon, Footprints as SpringBoot, Angry as Angular, Code2, FileInput, Trash2, ChevronDown, ChevronRight, Menu } from 'lucide-react';
import { Question, Category, Subcategory, NewQuestion, NewCategory, NewSubcategory } from './types';
import { supabase } from './supabase';
import { DeleteDialog } from './components/DeleteDialog';
import { UndoToast } from './components/UndoToast';

const AVAILABLE_ICONS = [
  { icon: 'SpringBoot', component: SpringBoot },
  { icon: 'ReactIcon', component: ReactIcon },
  { icon: 'Angular', component: Angular },
  { icon: 'Code2', component: Code2 },
];

interface DeleteState {
  type: 'question' | 'category' | 'subcategory';
  item: Question | Category | Subcategory;
  affectedQuestions?: Question[];
}

interface UndoState {
  message: string;
  restore: () => Promise<void>;
}

function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedParent, setSelectedParent] = useState<{ type: 'category' | 'subcategory', id: string }>({ type: 'category', id: '' });
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [newQuestion, setNewQuestion] = useState<NewQuestion>({ title: '', categoryId: '' });
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [showNewSubcategoryForm, setShowNewSubcategoryForm] = useState(false);
  const [showBulkImportForm, setShowBulkImportForm] = useState(false);
  const [bulkQuestions, setBulkQuestions] = useState('');
  const [newCategory, setNewCategory] = useState<NewCategory>({ name: '', icon: 'Code2' });
  const [newSubcategory, setNewSubcategory] = useState<NewSubcategory>({ name: '', categoryId: '' });
  const [deleteState, setDeleteState] = useState<DeleteState | null>(null);
  const [undoState, setUndoState] = useState<UndoState | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const fetchData = useCallback(async () => {
    const [categoriesResponse, subcategoriesResponse, questionsResponse] = await Promise.all([
      supabase.from('categories').select('*').order('timestamp', { ascending: false }),
      supabase.from('subcategories').select('*').order('timestamp', { ascending: false }),
      supabase.from('questions').select('*').order('timestamp', { ascending: false })
    ]);

    if (categoriesResponse.data) {
      setCategories(categoriesResponse.data);
      if (categoriesResponse.data.length > 0 && !selectedParent.id) {
        setSelectedParent({ type: 'category', id: categoriesResponse.data[0].id });
      }
    }

    if (subcategoriesResponse.data) {
      setSubcategories(subcategoriesResponse.data);
    }

    if (questionsResponse.data) {
      setQuestions(questionsResponse.data);
    }
  }, [selectedParent.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleParentChange = useCallback((type: 'category' | 'subcategory', id: string) => {
    setIsTransitioning(true);
    setSelectedParent({ type, id });
    setTimeout(() => setIsTransitioning(false), 200);
  }, []);

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.title.trim()) return;

    const categoryId = selectedParent.type === 'category' 
      ? selectedParent.id 
      : subcategories.find(s => s.id === selectedParent.id)?.category_id;

    if (!categoryId) {
      console.error('No valid category ID found');
      return;
    }

    const { error } = await supabase
      .from('questions')
      .insert([{
        title: newQuestion.title,
        parent_type: selectedParent.type,
        parent_id: selectedParent.id,
        category_id: categoryId,
        completed: false
      }]);

    if (!error) {
      fetchData();
      setNewQuestion({ title: '', categoryId: '' });
    } else {
      console.error('Error adding question:', error);
    }
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkQuestions.trim()) return;

    const categoryId = selectedParent.type === 'category'
      ? selectedParent.id
      : subcategories.find(s => s.id === selectedParent.id)?.category_id;

    if (!categoryId) {
      console.error('No valid category ID found');
      return;
    }

    const newQuestions = bulkQuestions
      .split('\n')
      .filter(q => q.trim())
      .map(title => ({
        title: title.trim(),
        parent_type: selectedParent.type,
        parent_id: selectedParent.id,
        category_id: categoryId,
        completed: false
      }));

    const { error } = await supabase.from('questions').insert(newQuestions);

    if (!error) {
      fetchData();
      setBulkQuestions('');
      setShowBulkImportForm(false);
    } else {
      console.error('Error bulk importing questions:', error);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;

    const { data, error } = await supabase
      .from('categories')
      .insert([{
        name: newCategory.name,
        icon: newCategory.icon
      }])
      .select()
      .single();

    if (!error && data) {
      setCategories([data, ...categories]);
      setNewCategory({ name: '', icon: 'Code2' });
      setShowNewCategoryForm(false);
      setSelectedParent({ type: 'category', id: data.id });
    }
  };

  const handleAddSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubcategory.name.trim() || !newSubcategory.categoryId) return;

    const { data, error } = await supabase
      .from('subcategories')
      .insert([{
        name: newSubcategory.name,
        category_id: newSubcategory.categoryId
      }])
      .select()
      .single();

    if (!error && data) {
      setSubcategories([data, ...subcategories]);
      setNewSubcategory({ name: '', categoryId: '' });
      setShowNewSubcategoryForm(false);
      setSelectedParent({ type: 'subcategory', id: data.id });
      setExpandedCategories(prev => new Set([...prev, data.category_id]));
    }
  };

  const toggleComplete = async (id: string) => {
    const question = questions.find(q => q.id === id);
    if (!question) return;

    const { error } = await supabase
      .from('questions')
      .update({ completed: !question.completed })
      .eq('id', id);

    if (!error) {
      setQuestions(questions.map(q => 
        q.id === id ? { ...q, completed: !q.completed } : q
      ));
    }
  };

  const handleDeleteQuestion = async (question: Question) => {
    setDeleteState({
      type: 'question',
      item: question
    });
  };

  const handleDeleteCategory = async (category: Category) => {
    const affectedQuestions = questions.filter(q => q.category_id === category.id);
    setDeleteState({
      type: 'category',
      item: category,
      affectedQuestions
    });
  };

  const handleDeleteSubcategory = async (subcategory: Subcategory) => {
    const affectedQuestions = questions.filter(
      q => q.parent_type === 'subcategory' && q.parent_id === subcategory.id
    );
    setDeleteState({
      type: 'subcategory',
      item: subcategory,
      affectedQuestions
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteState) return;

    const { type, item } = deleteState;
    let success = false;

    if (type === 'question') {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', item.id);

      if (!error) {
        const deletedQuestion = item as Question;
        const updatedQuestions = questions.filter(q => q.id !== item.id);
        setQuestions(updatedQuestions);
        success = true;

        setUndoState({
          message: 'Question deleted',
          restore: async () => {
            const { error } = await supabase
              .from('questions')
              .insert([deletedQuestion]);
            
            if (!error) {
              await fetchData();
            }
          }
        });
      }
    } else if (type === 'category') {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', item.id);

      if (!error) {
        const deletedCategory = item as Category;
        const affectedQuestions = questions.filter(q => q.category_id === item.id);
        const updatedCategories = categories.filter(c => c.id !== item.id);
        const updatedQuestions = questions.filter(q => q.category_id !== item.id);
        
        setCategories(updatedCategories);
        setQuestions(updatedQuestions);
        
        if (selectedParent.type === 'category' && selectedParent.id === item.id && updatedCategories.length > 0) {
          setSelectedParent({ type: 'category', id: updatedCategories[0].id });
        }
        
        success = true;

        setUndoState({
          message: 'Category and associated questions deleted',
          restore: async () => {
            const { error: categoryError } = await supabase
              .from('categories')
              .insert([deletedCategory]);
            
            if (!categoryError && affectedQuestions.length > 0) {
              await supabase
                .from('questions')
                .insert(affectedQuestions);
            }
            
            if (!categoryError) {
              await fetchData();
              setSelectedParent({ type: 'category', id: deletedCategory.id });
            }
          }
        });
      }
    } else if (type === 'subcategory') {
      const subcategory = item as Subcategory;
      const { error } = await supabase
        .from('subcategories')
        .delete()
        .eq('id', subcategory.id);

      if (!error) {
        const deletedSubcategory = subcategory;
        const affectedQuestions = questions.filter(
          q => q.parent_type === 'subcategory' && q.parent_id === subcategory.id
        );
        const updatedSubcategories = subcategories.filter(s => s.id !== subcategory.id);
        const updatedQuestions = questions.filter(
          q => !(q.parent_type === 'subcategory' && q.parent_id === subcategory.id)
        );
        
        setSubcategories(updatedSubcategories);
        setQuestions(updatedQuestions);
        
        if (selectedParent.type === 'subcategory' && selectedParent.id === subcategory.id) {
          setSelectedParent({ type: 'category', id: subcategory.category_id });
        }
        
        success = true;

        setUndoState({
          message: 'Subcategory and associated questions deleted',
          restore: async () => {
            const { error: subcategoryError } = await supabase
              .from('subcategories')
              .insert([deletedSubcategory]);
            
            if (!subcategoryError && affectedQuestions.length > 0) {
              await supabase
                .from('questions')
                .insert(affectedQuestions);
            }
            
            if (!subcategoryError) {
              await fetchData();
              setSelectedParent({ type: 'subcategory', id: deletedSubcategory.id });
            }
          }
        });
      }
    }

    if (success) {
      setDeleteState(null);
    }
  };

  const filteredQuestions = useMemo(() => 
    questions.filter(q => 
      q.parent_type === selectedParent.type && q.parent_id === selectedParent.id
    ),
    [questions, selectedParent]
  );

  const getParentName = () => {
    if (selectedParent.type === 'category') {
      return categories.find(c => c.id === selectedParent.id)?.name;
    } else {
      return subcategories.find(s => s.id === selectedParent.id)?.name;
    }
  };

  const completedCount = useMemo(() => 
    filteredQuestions.filter(q => q.completed).length,
    [filteredQuestions]
  );

  const totalCount = filteredQuestions.length;
  const progressPercentage = totalCount === 0 ? 0 : (completedCount / totalCount) * 100;

  const getIconComponent = (iconName: string) => {
    const iconData = AVAILABLE_ICONS.find(i => i.icon === iconName);
    return iconData?.component || Code2;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } w-64 bg-white border-r border-gray-200 overflow-y-auto transition-transform duration-200 ease-in-out z-30 md:relative md:translate-x-0`}
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-indigo-600" />
            <h1 className="text-lg font-bold text-gray-900">Categories</h1>
          </div>
        </div>
        
        <div className="p-2">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setShowNewCategoryForm(true)}
              className="flex-1 text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-1 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Category
            </button>
            <button
              onClick={() => setShowNewSubcategoryForm(true)}
              className="flex-1 text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-1 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Subcategory
            </button>
          </div>

          <div className="space-y-0.5">
            {categories.map((category) => {
              const IconComponent = getIconComponent(category.icon);
              const isSelected = selectedParent.type === 'category' && selectedParent.id === category.id;
              const isExpanded = expandedCategories.has(category.id);
              const categorySubcategories = subcategories.filter(s => s.category_id === category.id);
              const hasSubcategories = categorySubcategories.length > 0;

              return (
                <div key={category.id} className="rounded-lg overflow-hidden">
                  <div className="flex items-center">
                    <div className="w-8 flex items-center justify-center">
                      {hasSubcategories && (
                        <button
                          onClick={() => toggleCategoryExpansion(category.id)}
                          className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => handleParentChange('category', category.id)}
                      className={`flex items-center gap-2 px-2 py-2 flex-grow text-sm transition-colors ${
                        isSelected
                          ? 'bg-indigo-50 text-indigo-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <IconComponent className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{category.name}</span>
                    </button>
                    {isSelected && (
                      <button
                        onClick={() => handleDeleteCategory(category)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {isExpanded && hasSubcategories && (
                    <div className="ml-8 space-y-0.5">
                      {categorySubcategories.map(subcategory => {
                        const isSubcategorySelected = selectedParent.type === 'subcategory' && selectedParent.id === subcategory.id;
                        return (
                          <div key={subcategory.id} className="flex items-center">
                            <button
                              onClick={() => handleParentChange('subcategory', subcategory.id)}
                              className={`flex items-center flex-grow px-3 py-1.5 text-sm transition-colors rounded-md ${
                                isSubcategorySelected
                                  ? 'bg-indigo-50 text-indigo-600 font-medium'
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              {subcategory.name}
                            </button>
                            {isSubcategorySelected && (
                              <button
                                onClick={() => handleDeleteSubcategory(subcategory)}
                                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Mobile Header */}
        <div className="sticky top-0 z-20 md:hidden bg-white border-b border-gray-200 px-4 py-2">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-4 md:p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{getParentName()}</h2>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Progress
              </span>
              <span className="text-sm font-medium text-gray-700">
                {completedCount}/{totalCount} Completed
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Questions</h3>
              <button
                onClick={() => setShowBulkImportForm(true)}
                className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 flex items-center gap-1 transition-colors"
              >
                <FileInput className="w-4 h-4" />
                Bulk Import
              </button>
            </div>

            <form onSubmit={handleAddQuestion} className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newQuestion.title}
                  onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
                  placeholder={`Add a new question for ${getParentName()}...`}
                  className="flex-1 rounded-lg border-gray-300 border p-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add
                </button>
              </div>
            </form>

            <div className={`space-y-4 transition-opacity duration-200 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
              {filteredQuestions.map((question) => (
                <div
                  key={question.id}
                  className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center gap-4 hover:shadow-md transition-all duration-200 animate-fade-in"
                >
                  <button
                    onClick={() => toggleComplete(question.id)}
                    className="flex-shrink-0"
                  >
                    {question.completed ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-400" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-gray-900 ${question.completed ? 'line-through text-gray-500' : ''}`}>
                      {question.title}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      Added on {new Date(question.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteQuestion(question)}
                    className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showNewCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add New Category</h3>
              <button
                onClick={() => setShowNewCategoryForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddCategory}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full rounded-lg border-gray-300 border p-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., React, Angular, Vue"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Icon
                </label>
                <div className="flex gap-2">
                  {AVAILABLE_ICONS.map(({ icon, component: Icon }) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setNewCategory({ ...newCategory, icon })}
                      className={`p-2 rounded-lg ${
                        newCategory.icon === icon
                          ? 'bg-indigo-100 text-indigo-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                Add Category
              </button>
            </form>
          </div>
        </div>
      )}

      {showNewSubcategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add New Subcategory</h3>
              <button
                onClick={() => setShowNewSubcategoryForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSubcategory}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Category
                </label>
                <select
                  value={newSubcategory.categoryId}
                  onChange={(e) => setNewSubcategory({ ...newSubcategory, categoryId: e.target.value })}
                  className="w-full rounded-lg border-gray-300 border p-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subcategory Name
                </label>
                <input
                  type="text"
                  value={newSubcategory.name}
                  onChange={(e) => setNewSubcategory({ ...newSubcategory, name: e.target.value })}
                  className="w-full rounded-lg border-gray-300 border p-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Hooks, Components, State Management"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                Add Subcategory
              </button>
            </form>
          </div>
        </div>
      )}

      {showBulkImportForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Bulk Import Questions</h3>
              <button
                onClick={() => setShowBulkImportForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleBulkImport}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paste your questions (one per line)
                </label>
                <textarea
                  value={bulkQuestions}
                  onChange={(e) => setBulkQuestions(e.target.value)}
                  className="w-full h-64 rounded-lg border-gray-300 border p-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="What is dependency injection?&#10;How does Spring Boot autoconfiguration work?&#10;What is the Spring IoC container?"
                />
              </div>
              <button
                type="submit"
                             className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                Import Questions
              </button>
            </form>
          </div>
        </div>
      )}

      {deleteState && (
        <DeleteDialog
          type={deleteState.type}
          item={deleteState.item}
          affectedQuestions={deleteState.affectedQuestions}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteState(null)}
        />
      )}

      {undoState && (
        <UndoToast
          message={undoState.message}
          onUndo={async () => {
            await undoState.restore();
            setUndoState(null);
          }}
          onClose={() => setUndoState(null)}
        />
      )}
    </div>
  );
}

export default App;
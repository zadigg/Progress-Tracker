export interface Category {
  id: string;
  name: string;
  icon: string;
  timestamp: string;
  user_id?: string;
}

export interface Subcategory {
  id: string;
  name: string;
  category_id: string;
  timestamp: string;
}

export interface Question {
  id: string;
  category_id: string;
  parent_id: string;
  parent_type: 'category' | 'subcategory';
  title: string;
  completed: boolean;
  timestamp: string;
  user_id?: string;
}

export interface NewQuestion {
  title: string;
  categoryId: string;
}

export interface NewCategory {
  name: string;
  icon: string;
}

export interface NewSubcategory {
  name: string;
  categoryId: string;
}
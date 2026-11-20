import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  FolderTree,
  AlertCircle,
  Check,
  ChevronRight,
  ChevronDown,
  X,
  ShieldAlert,
  UploadCloud,
} from 'lucide-react';
import api from '../../services/api';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [currentId, setCurrentId] = useState(null);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');
  const [image, setImage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadCategories = async () => {
    setLoading(true);
    try {
      const [flatRes, treeRes] = await Promise.all([
        api.get('/categories?includeInactive=true'),
        api.get('/categories/tree?includeInactive=true'),
      ]);
      setCategories(flatRes.data.data || []);
      setCategoryTree(treeRes.data.data || []);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreateModal = (suggestedParentId = '') => {
    setModalMode('create');
    setCurrentId(null);
    setName('');
    setDescription('');
    setParentId(suggestedParentId);
    setImage('');
    setUploadingImage(false);
    setErrorMsg('');
    setSuccessMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setModalMode('edit');
    setCurrentId(cat._id);
    setName(cat.name);
    setDescription(cat.description || '');
    setParentId(cat.parentId?._id || cat.parentId || '');
    setImage(cat.image || '');
    setUploadingImage(false);
    setErrorMsg('');
    setSuccessMsg('');
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('folder', 'testround/categories');

      const res = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.data?.url) {
        setImage(res.data.data.url);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to upload image to Cloudinary');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        name,
        description,
        parentId: parentId || null,
        image,
      };

      if (modalMode === 'create') {
        await api.post('/categories', payload);
        setSuccessMsg('Category created successfully!');
      } else {
        await api.put(`/categories/${currentId}`, payload);
        setSuccessMsg('Category updated successfully!');
      }

      await loadCategories();
      setTimeout(() => setIsModalOpen(false), 800);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDeleteCategory = async (id, catName) => {
    if (!window.confirm(`Are you sure you want to delete category "${catName}"?`)) {
      return;
    }

    try {
      await api.delete(`/categories/${id}`);
      await loadCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete category');
    }
  };

  // Helper to get invalid parents for editing (self and all descendants to prevent circular loops)
  const getInvalidParentIds = (targetId) => {
    if (!targetId) return [];
    const invalid = [targetId.toString()];

    const addDescendants = (nodes) => {
      for (const node of nodes) {
        if (node.ancestors?.some((a) => a.toString() === targetId.toString())) {
          invalid.push(node._id.toString());
        }
        if (node.children) addDescendants(node.children);
      }
    };
    addDescendants(categoryTree);
    return invalid;
  };

  const invalidParentIds = modalMode === 'edit' ? getInvalidParentIds(currentId) : [];

  // Recursive tree row component
  const CategoryRow = ({ node, level = 0 }) => {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <>
        <tr className="hover:bg-slate-50 transition-colors">
          <td className="px-6 py-3.5">
            <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 24}px` }}>
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500"
                >
                  {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              ) : (
                <span className="w-6 inline-block text-slate-300">•</span>
              )}
              {node.image && (
                <img
                  src={node.image}
                  alt=""
                  className="w-6 h-6 rounded-md object-cover border border-slate-200"
                />
              )}
              <span className="font-bold text-slate-900">{node.name}</span>
              <span className="text-[10px] font-mono text-slate-400">({node.slug})</span>
            </div>
          </td>
          <td className="px-6 py-3.5 text-slate-500 max-w-xs truncate">
            {node.description || '—'}
          </td>
          <td className="px-6 py-3.5 text-center">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                node.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              }`}
            >
              {node.isActive ? 'Active' : 'Inactive'}
            </span>
          </td>
          <td className="px-6 py-3.5 text-right space-x-2">
            <button
              onClick={() => openCreateModal(node._id)}
              className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold"
              title="Add subcategory under this node"
            >
              + Sub
            </button>
            <button
              onClick={() => openEditModal(node)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg"
              title="Edit category"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteCategory(node._id, node.name)}
              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
              title="Delete category"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </td>
        </tr>

        {hasChildren &&
          expanded &&
          node.children.map((child) => (
            <CategoryRow key={child._id} node={child} level={level + 1} />
          ))}
      </>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Multi-Level Category Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Infinite nesting depth with circular dependency prevention and automatic descendant indexing
          </p>
        </div>

        <button
          onClick={() => openCreateModal('')}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Add Root Category
        </button>
      </div>

      {/* Category Tree Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-600">
          <FolderTree className="w-4 h-4 text-indigo-600" />
          Category Hierarchy Explorer
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading category tree...</div>
        ) : categoryTree.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-3">
            <p>No categories found in the database.</p>
            <button
              onClick={() => openCreateModal('')}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold"
            >
              Create First Category
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Category Name & Hierarchy</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categoryTree.map((rootNode) => (
                  <CategoryRow key={rootNode._id} node={rootNode} level={0} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Category Modal (Create / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  {modalMode === 'create' ? 'Create New Category' : 'Edit Category'}
                </h3>
                <p className="text-xs text-slate-400">
                  {modalMode === 'create'
                    ? 'Attach to any parent or make a top-level root category'
                    : 'System enforces circular dependency verification'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                  <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Android Phones"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Parent Category
                </label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white"
                >
                  <option value="">-- No Parent (Root Category) --</option>
                  {categories.map((cat) => {
                    const isInvalid = invalidParentIds.includes(cat._id.toString());
                    return (
                      <option key={cat._id} value={cat._id} disabled={isInvalid}>
                        {cat.path || cat.name} {isInvalid ? '(Invalid: cycle conflict)' : ''}
                      </option>
                    );
                  })}
                </select>
                {modalMode === 'edit' && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Disabled options represent the category itself or its descendants to prevent circular relationships.
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="2"
                  placeholder="Category overview..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white"
                ></textarea>
              </div>

              {/* Cloudinary Image Upload */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Category Image (Cloudinary)
                </label>
                {image ? (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                    <img
                      src={image}
                      alt="Category Preview"
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200 bg-white"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-slate-700 truncate">{image}</p>
                      <span className="text-[10px] text-emerald-600 font-bold block">✓ Saved to Cloudinary</span>
                      <button
                        type="button"
                        onClick={() => setImage('')}
                        className="text-[11px] text-red-600 font-bold hover:underline mt-0.5"
                      >
                        Change / Remove Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:border-indigo-400 transition-colors bg-slate-50">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    {uploadingImage ? (
                      <div className="flex items-center justify-center gap-2 text-xs font-semibold text-indigo-600">
                        <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                        Uploading to Cloudinary...
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <UploadCloud className="w-6 h-6 text-slate-400 mx-auto" />
                        <p className="text-xs font-semibold text-slate-700">Click to upload category image</p>
                        <p className="text-[10px] text-slate-400">PNG, JPG, WEBP saved directly to Cloudinary</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  {modalMode === 'create' ? 'Create Category' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

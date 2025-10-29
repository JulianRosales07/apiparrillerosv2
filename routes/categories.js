const express = require('express');
const fs = require('fs').promises;
const router = express.Router();
const dbPath = './data/db.json';

router.get('/', async (req, res, next) => {
  try {
    const data = JSON.parse(await fs.readFile(dbPath, 'utf-8'));
    res.json(data.categories);
  } catch (error) {
    console.error('Error en GET /api/categories:', error);
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const data = JSON.parse(await fs.readFile(dbPath, 'utf-8'));
    const newCategory = { ...req.body, id: String(Date.now()) };
    data.categories.push(newCategory);
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8');
    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error en POST /api/categories:', error);
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const data = JSON.parse(await fs.readFile(dbPath, 'utf-8'));
    const index = data.categories.findIndex(c => c.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'Category not found' });
    }
    data.categories[index] = { ...data.categories[index], ...req.body };
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8');
    res.json(data.categories[index]);
  } catch (error) {
    console.error('Error en PUT /api/categories/:id:', error);
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const data = JSON.parse(await fs.readFile(dbPath, 'utf-8'));
    const initialLength = data.categories.length;
    data.categories = data.categories.filter(c => c.id !== req.params.id);

    if (data.categories.length === initialLength) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8');
    res.status(204).send();
  } catch (error) {
    console.error('Error en DELETE /api/categories/:id:', error);
    next(error);
  }
});

module.exports = router;
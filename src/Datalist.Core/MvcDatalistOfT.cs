using System;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Linq.Dynamic;
using System.Reflection;

namespace Datalist
{
    public abstract class MvcDatalist<T> : MvcDatalist where T : class
    {
        public Func<T, String> Id { get; set; }
        public Func<T, String> Autocomplete { get; set; }
        public virtual IEnumerable<PropertyInfo> AttributedProperties
        {
            get
            {
                return typeof(T)
                    .GetProperties()
                    .Where(property => property.IsDefined(typeof(DatalistColumnAttribute), false))
                    .OrderBy(property => property.GetCustomAttribute<DatalistColumnAttribute>(false).Position);
            }
        }

        protected MvcDatalist()
        {
            Id = (model) => GetValue(model, "Id");
            Autocomplete = (model) => GetValue(model, Columns.Where(col => !col.Hidden).Select(col => col.Key).FirstOrDefault() ?? "");

            foreach (PropertyInfo property in AttributedProperties)
            {
                DatalistColumnAttribute column = property.GetCustomAttribute<DatalistColumnAttribute>(false);
                Columns.Add(new DatalistColumn(GetColumnKey(property), GetColumnHeader(property))
                {
                    CssClass = GetColumnCssClass(property),
                    Filterable = column.Filterable,
                    Hidden = column.Hidden
                });
            }
        }
        public virtual String GetColumnKey(PropertyInfo property)
        {
            if (property == null)
                throw new ArgumentNullException(nameof(property));

            return property.Name;
        }
        public virtual String GetColumnHeader(PropertyInfo property)
        {
            return property?.GetCustomAttribute<DisplayAttribute>(false)?.GetShortName();
        }
        public virtual String GetColumnCssClass(PropertyInfo property)
        {
            return null;
        }

        public override DatalistData GetData()
        {
            IQueryable<T> models = GetModels();
            IQueryable<T> selected = new T[0].AsQueryable();
            IQueryable<T> notSelected = Sort(FilterByRequest(models));

            if (Filter.Ids.Count == 0 && Filter.Selected.Count > 0)
                selected = Sort(FilterBySelected(models, Filter.Selected));

            return FormDatalistData(notSelected, selected, Page(notSelected));
        }
        public abstract IQueryable<T> GetModels();

        private IQueryable<T> FilterByRequest(IQueryable<T> models)
        {
            if (Filter.Ids.Count > 0)
                return FilterByIds(models, Filter.Ids);

            if (Filter.Selected.Count > 0)
                models = FilterByNotIds(models, Filter.Selected);

            if (Filter.CheckIds.Count > 0)
                models = FilterByCheckIds(models, Filter.CheckIds);

            if (Filter.AdditionalFilters.Count > 0)
                models = FilterByAdditionalFilters(models);

            return FilterBySearch(models);
        }
        public virtual IQueryable<T> FilterBySearch(IQueryable<T> models)
        {
            if (String.IsNullOrEmpty(Filter.Search))
                return models;

            List<String> queries = new List<String>();
            foreach (String property in Columns.Where(column => !column.Hidden && column.Filterable).Select(column => column.Key))
                if (typeof(T).GetProperty(property)?.PropertyType == typeof(String))
                    queries.Add($"({property} != null && {property}.ToLower().Contains(@0))");

            if (queries.Count == 0)
                return models;

            return models.Where(String.Join(" || ", queries), Filter.Search.ToLower());
        }
        public virtual IQueryable<T> FilterByAdditionalFilters(IQueryable<T> models)
        {
            foreach (KeyValuePair<String, Object> filter in Filter.AdditionalFilters.Where(item => item.Value != null))
                if (filter.Value is IEnumerable && !(filter.Value is String))
                    models = models.Where($"@0.Contains(outerIt.{filter.Key})", filter.Value).AsQueryable();
                else
                    models = models.Where($"({filter.Key} != null && {filter.Key} == @0)", filter.Value);

            return models;
        }
        public virtual IQueryable<T> FilterByIds(IQueryable<T> models, IList<String> ids)
        {
            PropertyInfo key = typeof(T).GetProperties()
                .FirstOrDefault(prop => prop.IsDefined(typeof(KeyAttribute))) ?? typeof(T).GetProperty("Id");

            if (key == null)
                throw new DatalistException($"'{typeof(T).Name}' type does not have key or property named 'Id', required for automatic id filtering.");

            if (key.PropertyType == typeof(String))
                return models.Where($"@0.Contains(outerIt.{key.Name})", ids);

            if (key.PropertyType == typeof(Int32))
                return models.Where($"@0.Contains(outerIt.{key.Name})", Parse<Int32>(ids));

            if (key.PropertyType == typeof(Int64))
                return models.Where($"@0.Contains(outerIt.{key.Name})", Parse<Int64>(ids));

            throw new DatalistException($"'{typeof(T).Name}.{key.Name}' property type has to be a string, int or a long.");
        }
        public virtual IQueryable<T> FilterByNotIds(IQueryable<T> models, IList<String> ids)
        {
            PropertyInfo key = typeof(T).GetProperties()
                .FirstOrDefault(prop => prop.IsDefined(typeof(KeyAttribute))) ?? typeof(T).GetProperty("Id");

            if (key == null)
                throw new DatalistException($"'{typeof(T).Name}' type does not have key or property named 'Id', required for automatic id filtering.");

            if (key.PropertyType == typeof(String))
                return models.Where($"!@0.Contains(outerIt.{key.Name})", ids);

            if (key.PropertyType == typeof(Int32))
                return models.Where($"!@0.Contains(outerIt.{key.Name})", Parse<Int32>(ids));

            if (key.PropertyType == typeof(Int64))
                return models.Where($"!@0.Contains(outerIt.{key.Name})", Parse<Int64>(ids));

            throw new DatalistException($"'{typeof(T).Name}.{key.Name}' property type has to be a string, int or a long.");
        }
        public virtual IQueryable<T> FilterByCheckIds(IQueryable<T> models, IList<String> ids)
        {
            return FilterByIds(models, ids);
        }
        public virtual IQueryable<T> FilterBySelected(IQueryable<T> models, IList<String> ids)
        {
            return FilterByIds(models, ids);
        }

        public virtual IQueryable<T> Sort(IQueryable<T> models)
        {
            if (String.IsNullOrWhiteSpace(Filter.Sort))
                if (DatalistQuery.IsOrdered(models))
                    return models;
                else
                    return models.OrderBy(model => 0);

            return models.OrderBy(Filter.Sort + " " + Filter.Order);
        }

        public virtual IQueryable<T> Page(IQueryable<T> models)
        {
            Filter.TotalRows = models.Count();
            Filter.Page = Math.Max(0, Filter.Page);
            Filter.Rows = Math.Min(Math.Max(1, Filter.Rows), 99);
            Filter.Page = Math.Min(Filter.Page, (Int32)Math.Ceiling(Filter.TotalRows / (Double)Filter.Rows) - 1);

            return models.Skip(Filter.Page * Filter.Rows).Take(Filter.Rows);
        }

        public virtual DatalistData FormDatalistData(IQueryable<T> filtered, IQueryable<T> selected, IQueryable<T> notSelected)
        {
            DatalistData data = new DatalistData();
            data.FilteredRows = Filter.TotalRows;
            data.Columns = Columns;

            foreach (T model in selected.ToArray().Concat(notSelected).ToArray())
            {
                Dictionary<String, String> row = new Dictionary<String, String>();
                AddId(row, model);
                AddAutocomplete(row, model);
                AddData(row, model);

                data.Rows.Add(row);
            }

            return data;
        }
        public virtual void AddId(Dictionary<String, String> row, T model)
        {
            row[IdKey] = Id(model);
        }
        public virtual void AddAutocomplete(Dictionary<String, String> row, T model)
        {
            row[AcKey] = Autocomplete(model);
        }
        public virtual void AddData(Dictionary<String, String> row, T model)
        {
            foreach (DatalistColumn column in Columns)
                row[column.Key] = GetValue(model, column.Key);
        }

        private List<TNumber> Parse<TNumber>(IList<String> values)
        {
            TypeConverter converter = TypeDescriptor.GetConverter(typeof(TNumber));
            List<TNumber> numbers = new List<TNumber>();

            foreach (String value in values)
                numbers.Add((TNumber)converter.ConvertFrom(value));

            return numbers;
        }
        private String GetValue(T model, String propertyName)
        {
            PropertyInfo property = typeof(T).GetProperty(propertyName);
            if (property == null)
                return null;

            DatalistColumnAttribute column = property.GetCustomAttribute<DatalistColumnAttribute>(false);
            if (column?.Format != null)
                return String.Format(column.Format, property.GetValue(model));

            return property.GetValue(model)?.ToString();
        }
    }
}

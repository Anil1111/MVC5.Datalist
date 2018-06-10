using Datalist.Tests.Objects;
using NSubstitute;
using System;
using System.Collections;
using System.Web.Mvc;
using Xunit;

namespace Datalist.Tests.Unit
{
    public class DatalistExtensionsTests
    {
        private TestDatalist<TestModel> datalist;
        private HtmlHelper<TestModel> html;

        public DatalistExtensionsTests()
        {
            html = MockHtmlHelper();
            datalist = new TestDatalist<TestModel>();

            datalist.Filter.Page = 2;
            datalist.Filter.Rows = 11;
            datalist.Dialog = "Dialog";
            datalist.Name = "DatalistName";
            datalist.Filter.Sort = "First";
            datalist.Filter.Search = "Test";
            datalist.AdditionalFilters.Clear();
            datalist.AdditionalFilters.Add("Add1");
            datalist.AdditionalFilters.Add("Add2");
            datalist.Title = "Dialog datalist title";
            datalist.Url = "http://localhost/Datalist";
            datalist.Filter.Order = DatalistSortOrder.Desc;
        }

        #region AutoComplete<TModel>(this IHtmlHelper<TModel> html, String name, MvcDatalist model, Object value = null, Object htmlAttributes = null)

        [Fact]
        public void AutoComplete_Readonly()
        {
            datalist.ReadOnly = true;

            String actual = html.AutoComplete("Test", datalist, "Value", new { @class = "classes", attribute = "attr" }).ToString();
            String expected =
                "<div attribute=\"attr\" class=\"datalist-browseless datalist-readonly datalist classes\" data-dialog=\"Dialog\" " +
                        "data-filters=\"Add1,Add2\" data-for=\"Test\" data-multi=\"false\" data-order=\"Desc\" " +
                        "data-page=\"2\" data-readonly=\"true\" data-rows=\"11\" data-search=\"Test\" data-sort=\"First\" " +
                        "data-title=\"Dialog datalist title\" data-url=\"http://localhost/Datalist\">" +
                    "<div class=\"datalist-values\" data-for=\"Test\">" +
                        "<input autocomplete=\"off\" class=\"datalist-value\" id=\"Test\" name=\"Test\" type=\"hidden\" value=\"Value\" />" +
                    "</div>" +
                    "<div class=\"datalist-control\" data-for=\"Test\">" +
                        "<input autocomplete=\"off\" class=\"datalist-input\" id=\"DatalistName\" name=\"DatalistName\" readonly=\"readonly\" type=\"text\" value=\"\" />" +
                        "<div class=\"datalist-control-loader\"></div>" +
                        "<div class=\"datalist-control-error\">!</div>" +
                    "</div>" +
                "</div>";

            Assert.Equal(expected, actual);
        }

        [Fact]
        public void AutoComplete_FromDatalist()
        {
            String actual = html.AutoComplete("Test", datalist, "Value", new { @class = "classes", attribute = "attr" }).ToString();
            String expected =
                "<div attribute=\"attr\" class=\"datalist-browseless datalist classes\" data-dialog=\"Dialog\" " +
                        "data-filters=\"Add1,Add2\" data-for=\"Test\" data-multi=\"false\" data-order=\"Desc\" " +
                        "data-page=\"2\" data-readonly=\"false\" data-rows=\"11\" data-search=\"Test\" data-sort=\"First\" " +
                        "data-title=\"Dialog datalist title\" data-url=\"http://localhost/Datalist\">" +
                    "<div class=\"datalist-values\" data-for=\"Test\">" +
                        "<input autocomplete=\"off\" class=\"datalist-value\" id=\"Test\" name=\"Test\" type=\"hidden\" value=\"Value\" />" +
                    "</div>" +
                    "<div class=\"datalist-control\" data-for=\"Test\">" +
                        "<input autocomplete=\"off\" class=\"datalist-input\" id=\"DatalistName\" name=\"DatalistName\" type=\"text\" value=\"\" />" +
                        "<div class=\"datalist-control-loader\"></div>" +
                        "<div class=\"datalist-control-error\">!</div>" +
                    "</div>" +
                "</div>";

            Assert.Equal(expected, actual);
        }

        [Fact]
        public void AutoComplete_FromMultiDatalist()
        {
            datalist.Multi = true;

            String actual = html.AutoComplete("Test", datalist, new[] { "Value1", "Value2" }, new { @class = "classes", attribute = "attr" }).ToString();
            String expected =
                "<div attribute=\"attr\" class=\"datalist-browseless datalist classes\" data-dialog=\"Dialog\" " +
                        "data-filters=\"Add1,Add2\" data-for=\"Test\" data-multi=\"true\" data-order=\"Desc\" " +
                        "data-page=\"2\" data-readonly=\"false\" data-rows=\"11\" data-search=\"Test\" data-sort=\"First\" " +
                        "data-title=\"Dialog datalist title\" data-url=\"http://localhost/Datalist\">" +
                    "<div class=\"datalist-values\" data-for=\"Test\">" +
                        "<input autocomplete=\"off\" class=\"datalist-value\" id=\"Test\" name=\"Test\" type=\"hidden\" value=\"Value1\" />" +
                        "<input autocomplete=\"off\" class=\"datalist-value\" id=\"Test\" name=\"Test\" type=\"hidden\" value=\"Value2\" />" +
                    "</div>" +
                    "<div class=\"datalist-control\" data-for=\"Test\">" +
                        "<input autocomplete=\"off\" class=\"datalist-input\" id=\"DatalistName\" name=\"DatalistName\" type=\"text\" value=\"\" />" +
                        "<div class=\"datalist-control-loader\"></div>" +
                        "<div class=\"datalist-control-error\">!</div>" +
                    "</div>" +
                "</div>";

            Assert.Equal(expected, actual);
        }

        #endregion

        #region AutoCompleteFor<TModel, TProperty>(this IHtmlHelper<TModel> html, Expression<Func<TModel, TProperty>> expression, MvcDatalist model, Object htmlAttributes = null)

        [Fact]
        public void AutoCompleteFor_Readonly()
        {
            datalist.ReadOnly = true;

            String actual = html.AutoCompleteFor(model => model.ParentId, datalist, new { @class = "classes", attribute = "attr" }).ToString();
            String expected =
                "<div attribute=\"attr\" class=\"datalist-browseless datalist-readonly datalist classes\" data-dialog=\"Dialog\" " +
                        "data-filters=\"Add1,Add2\" data-for=\"ParentId\" data-multi=\"false\" data-order=\"Desc\" " +
                        "data-page=\"2\" data-readonly=\"true\" data-rows=\"11\" data-search=\"Test\" data-sort=\"First\" " +
                        "data-title=\"Dialog datalist title\" data-url=\"http://localhost/Datalist\">" +
                    "<div class=\"datalist-values\" data-for=\"ParentId\">" +
                        "<input autocomplete=\"off\" class=\"datalist-value\" id=\"ParentId\" name=\"ParentId\" type=\"hidden\" value=\"Model&#39;s parent ID\" />" +
                    "</div>" +
                    "<div class=\"datalist-control\" data-for=\"ParentId\">" +
                        "<input autocomplete=\"off\" class=\"datalist-input\" id=\"DatalistName\" name=\"DatalistName\" readonly=\"readonly\" type=\"text\" value=\"\" />" +
                        "<div class=\"datalist-control-loader\"></div>" +
                        "<div class=\"datalist-control-error\">!</div>" +
                    "</div>" +
                "</div>";

            Assert.Equal(expected, actual);
        }

        [Fact]
        public void AutoCompleteFor_FromDatalist()
        {
            String actual = html.AutoCompleteFor(model => model.ParentId, datalist, new { @class = "classes", attribute = "attr" }).ToString();
            String expected =
                "<div attribute=\"attr\" class=\"datalist-browseless datalist classes\" data-dialog=\"Dialog\" " +
                        "data-filters=\"Add1,Add2\" data-for=\"ParentId\" data-multi=\"false\" data-order=\"Desc\" " +
                        "data-page=\"2\" data-readonly=\"false\" data-rows=\"11\" data-search=\"Test\" data-sort=\"First\" " +
                        "data-title=\"Dialog datalist title\" data-url=\"http://localhost/Datalist\">" +
                    "<div class=\"datalist-values\" data-for=\"ParentId\">" +
                        "<input autocomplete=\"off\" class=\"datalist-value\" id=\"ParentId\" name=\"ParentId\" type=\"hidden\" value=\"Model&#39;s parent ID\" />" +
                    "</div>" +
                    "<div class=\"datalist-control\" data-for=\"ParentId\">" +
                        "<input autocomplete=\"off\" class=\"datalist-input\" id=\"DatalistName\" name=\"DatalistName\" type=\"text\" value=\"\" />" +
                        "<div class=\"datalist-control-loader\"></div>" +
                        "<div class=\"datalist-control-error\">!</div>" +
                    "</div>" +
                "</div>";

            Assert.Equal(expected, actual);
        }

        [Fact]
        public void AutoCompleteFor_FromMultiDatalist()
        {
            datalist.Multi = true;
            html.ViewData.Model.Values = new[] { "Value1's", "Value2's" };

            String actual = html.AutoCompleteFor(model => model.Values, datalist, new { @class = "classes", attribute = "attr" }).ToString();
            String expected =
                "<div attribute=\"attr\" class=\"datalist-browseless datalist classes\" data-dialog=\"Dialog\" " +
                        "data-filters=\"Add1,Add2\" data-for=\"Values\" data-multi=\"true\" data-order=\"Desc\" " +
                        "data-page=\"2\" data-readonly=\"false\" data-rows=\"11\" data-search=\"Test\" data-sort=\"First\" " +
                        "data-title=\"Dialog datalist title\" data-url=\"http://localhost/Datalist\">" +
                    "<div class=\"datalist-values\" data-for=\"Values\">" +
                        "<input autocomplete=\"off\" class=\"datalist-value\" id=\"Values\" name=\"Values\" type=\"hidden\" value=\"Value1&#39;s\" />" +
                        "<input autocomplete=\"off\" class=\"datalist-value\" id=\"Values\" name=\"Values\" type=\"hidden\" value=\"Value2&#39;s\" />" +
                    "</div>" +
                    "<div class=\"datalist-control\" data-for=\"Values\">" +
                        "<input autocomplete=\"off\" class=\"datalist-input\" id=\"DatalistName\" name=\"DatalistName\" type=\"text\" value=\"\" />" +
                        "<div class=\"datalist-control-loader\"></div>" +
                        "<div class=\"datalist-control-error\">!</div>" +
                    "</div>" +
                "</div>";

            Assert.Equal(expected, actual);
        }

        #endregion

        #region Datalist<TModel>(this IHtmlHelper<TModel> html, String name, MvcDatalist model, Object value = null, Object htmlAttributes = null)

        [Fact]
        public void Datalist_Readonly()
        {
            datalist.ReadOnly = true;

            String actual = html.Datalist("Test", datalist, 1, new { @class = "classes", attribute = "attr" }).ToString();
            String expected =
                "<div attribute=\"attr\" class=\"datalist-readonly datalist classes\" data-dialog=\"Dialog\" " +
                        "data-filters=\"Add1,Add2\" data-for=\"Test\" data-multi=\"false\" data-order=\"Desc\" " +
                        "data-page=\"2\" data-readonly=\"true\" data-rows=\"11\" data-search=\"Test\" data-sort=\"First\" " +
                        "data-title=\"Dialog datalist title\" data-url=\"http://localhost/Datalist\">" +
                    "<div class=\"datalist-values\" data-for=\"Test\">" +
                        "<input autocomplete=\"off\" class=\"datalist-value\" id=\"Test\" name=\"Test\" type=\"hidden\" value=\"1\" />" +
                    "</div>" +
                    "<div class=\"datalist-control\" data-for=\"Test\">" +
                        "<input autocomplete=\"off\" class=\"datalist-input\" id=\"DatalistName\" name=\"DatalistName\" readonly=\"readonly\" type=\"text\" value=\"\" />" +
                        "<div class=\"datalist-control-loader\"></div>" +
                        "<div class=\"datalist-control-error\">!</div>" +
                    "</div>" +
                    "<button class=\"datalist-browser\" data-for=\"Test\">" +
                        "<span class=\"datalist-icon\"></span>" +
                    "</button>" +
                "</div>";

            Assert.Equal(expected, actual);
        }

        [Fact]
        public void Datalist_FromDatalist()
        {
            String actual = html.Datalist("Test", datalist, 1, new { @class = "classes", attribute = "attr" }).ToString();
            String expected =
                "<div attribute=\"attr\" class=\"datalist classes\" data-dialog=\"Dialog\" " +
                        "data-filters=\"Add1,Add2\" data-for=\"Test\" data-multi=\"false\" data-order=\"Desc\" " +
                        "data-page=\"2\" data-readonly=\"false\" data-rows=\"11\" data-search=\"Test\" data-sort=\"First\" " +
                        "data-title=\"Dialog datalist title\" data-url=\"http://localhost/Datalist\">" +
                    "<div class=\"datalist-values\" data-for=\"Test\">" +
                        "<input autocomplete=\"off\" class=\"datalist-value\" id=\"Test\" name=\"Test\" type=\"hidden\" value=\"1\" />" +
                    "</div>" +
                    "<div class=\"datalist-control\" data-for=\"Test\">" +
                        "<input autocomplete=\"off\" class=\"datalist-input\" id=\"DatalistName\" name=\"DatalistName\" type=\"text\" value=\"\" />" +
                        "<div class=\"datalist-control-loader\"></div>" +
                        "<div class=\"datalist-control-error\">!</div>" +
                    "</div>" +
                    "<button class=\"datalist-browser\" data-for=\"Test\">" +
                        "<span class=\"datalist-icon\"></span>" +
                    "</button>" +
                "</div>";

            Assert.Equal(expected, actual);
        }

        [Fact]
        public void Datalist_FromMultiDatalist()
        {
            datalist.Multi = true;

            String actual = html.Datalist("Test", datalist, 1, new { @class = "classes", attribute = "attr" }).ToString();
            String expected =
                "<div attribute=\"attr\" class=\"datalist classes\" data-dialog=\"Dialog\" " +
                        "data-filters=\"Add1,Add2\" data-for=\"Test\" data-multi=\"true\" data-order=\"Desc\" " +
                        "data-page=\"2\" data-readonly=\"false\" data-rows=\"11\" data-search=\"Test\" data-sort=\"First\" " +
                        "data-title=\"Dialog datalist title\" data-url=\"http://localhost/Datalist\">" +
                    "<div class=\"datalist-values\" data-for=\"Test\">" +
                    "</div>" +
                    "<div class=\"datalist-control\" data-for=\"Test\">" +
                        "<input autocomplete=\"off\" class=\"datalist-input\" id=\"DatalistName\" name=\"DatalistName\" type=\"text\" value=\"\" />" +
                        "<div class=\"datalist-control-loader\"></div>" +
                        "<div class=\"datalist-control-error\">!</div>" +
                    "</div>" +
                    "<button class=\"datalist-browser\" data-for=\"Test\">" +
                        "<span class=\"datalist-icon\"></span>" +
                    "</button>" +
                "</div>";

            Assert.Equal(expected, actual);
        }

        #endregion

        #region DatalistFor<TModel, TProperty>(this IHtmlHelper<TModel> html, Expression<Func<TModel, TProperty>> expression, MvcDatalist model, Object htmlAttributes = null)

        [Fact]
        public void DatalistFor_Readonly()
        {
            datalist.ReadOnly = true;

            String actual = html.DatalistFor(model => model.ParentId, datalist, new { @class = "classes", attribute = "attr" }).ToString();
            String expected =
                "<div attribute=\"attr\" class=\"datalist-readonly datalist classes\" data-dialog=\"Dialog\" " +
                        "data-filters=\"Add1,Add2\" data-for=\"ParentId\" data-multi=\"false\" data-order=\"Desc\" " +
                        "data-page=\"2\" data-readonly=\"true\" data-rows=\"11\" data-search=\"Test\" data-sort=\"First\" " +
                        "data-title=\"Dialog datalist title\" data-url=\"http://localhost/Datalist\">" +
                    "<div class=\"datalist-values\" data-for=\"ParentId\">" +
                        "<input autocomplete=\"off\" class=\"datalist-value\" id=\"ParentId\" name=\"ParentId\" type=\"hidden\" value=\"Model&#39;s parent ID\" />" +
                    "</div>" +
                    "<div class=\"datalist-control\" data-for=\"ParentId\">" +
                        "<input autocomplete=\"off\" class=\"datalist-input\" id=\"DatalistName\" name=\"DatalistName\" readonly=\"readonly\" type=\"text\" value=\"\" />" +
                        "<div class=\"datalist-control-loader\"></div>" +
                        "<div class=\"datalist-control-error\">!</div>" +
                    "</div>" +
                    "<button class=\"datalist-browser\" data-for=\"ParentId\">" +
                        "<span class=\"datalist-icon\"></span>" +
                    "</button>" +
                "</div>";

            Assert.Equal(expected, actual);
        }

        [Fact]
        public void DatalistFor_FromDatalist()
        {
            String actual = html.DatalistFor(model => model.ParentId, datalist, new { @class = "classes", attribute = "attr" }).ToString();
            String expected =
                "<div attribute=\"attr\" class=\"datalist classes\" data-dialog=\"Dialog\" " +
                        "data-filters=\"Add1,Add2\" data-for=\"ParentId\" data-multi=\"false\" data-order=\"Desc\" " +
                        "data-page=\"2\" data-readonly=\"false\" data-rows=\"11\" data-search=\"Test\" data-sort=\"First\" " +
                        "data-title=\"Dialog datalist title\" data-url=\"http://localhost/Datalist\">" +
                    "<div class=\"datalist-values\" data-for=\"ParentId\">" +
                        "<input autocomplete=\"off\" class=\"datalist-value\" id=\"ParentId\" name=\"ParentId\" type=\"hidden\" value=\"Model&#39;s parent ID\" />" +
                    "</div>" +
                    "<div class=\"datalist-control\" data-for=\"ParentId\">" +
                        "<input autocomplete=\"off\" class=\"datalist-input\" id=\"DatalistName\" name=\"DatalistName\" type=\"text\" value=\"\" />" +
                        "<div class=\"datalist-control-loader\"></div>" +
                        "<div class=\"datalist-control-error\">!</div>" +
                    "</div>" +
                    "<button class=\"datalist-browser\" data-for=\"ParentId\">" +
                        "<span class=\"datalist-icon\"></span>" +
                    "</button>" +
                "</div>";

            Assert.Equal(expected, actual);
        }

        [Fact]
        public void DatalistFor_FromMultiDatalist()
        {
            datalist.Multi = true;

            String actual = html.DatalistFor(model => model.Values, datalist, new { @class = "classes", attribute = "attr" }).ToString();
            String expected =
                "<div attribute=\"attr\" class=\"datalist classes\" data-dialog=\"Dialog\" " +
                        "data-filters=\"Add1,Add2\" data-for=\"Values\" data-multi=\"true\" data-order=\"Desc\" " +
                        "data-page=\"2\" data-readonly=\"false\" data-rows=\"11\" data-search=\"Test\" data-sort=\"First\" " +
                        "data-title=\"Dialog datalist title\" data-url=\"http://localhost/Datalist\">" +
                    "<div class=\"datalist-values\" data-for=\"Values\">" +
                    "</div>" +
                    "<div class=\"datalist-control\" data-for=\"Values\">" +
                        "<input autocomplete=\"off\" class=\"datalist-input\" id=\"DatalistName\" name=\"DatalistName\" type=\"text\" value=\"\" />" +
                        "<div class=\"datalist-control-loader\"></div>" +
                        "<div class=\"datalist-control-error\">!</div>" +
                    "</div>" +
                    "<button class=\"datalist-browser\" data-for=\"Values\">" +
                        "<span class=\"datalist-icon\"></span>" +
                    "</button>" +
                "</div>";

            Assert.Equal(expected, actual);
        }

        #endregion

        #region Test helpers

        private HtmlHelper<TestModel> MockHtmlHelper()
        {
            ViewDataDictionary<TestModel> viewData = new ViewDataDictionary<TestModel>(new TestModel());
            IViewDataContainer container = Substitute.For<IViewDataContainer>();
            viewData.Model.ParentId = "Model's parent ID";
            container.ViewData = viewData;

            ViewContext viewContext = Substitute.For<ViewContext>();
            viewContext.HttpContext.Items.Returns(new Hashtable());
            viewContext.ViewData = viewData;

            return new HtmlHelper<TestModel>(viewContext, container);
        }

        #endregion
    }
}

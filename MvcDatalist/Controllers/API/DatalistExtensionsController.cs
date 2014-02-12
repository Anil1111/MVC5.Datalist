﻿using System.Web.Mvc;

namespace MvcDatalist.Controllers.API
{
    public class DatalistExtensionsController : Controller
    {
        #region Extensions

        [HttpGet]
        public ActionResult Autocomplete()
        {
            return View();
        }

        [HttpGet]
        public ActionResult AutocompleteFor()
        {
            return View();
        }

        [HttpGet]
        public ActionResult Datalist()
        {
            return View();
        }

        [HttpGet]
        public ActionResult DatalistFor()
        {
            return View();
        }

        #endregion
    }
}

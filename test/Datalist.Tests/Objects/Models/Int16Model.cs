using System;
using System.ComponentModel.DataAnnotations;

namespace Datalist.Tests.Objects
{
    public class Int16Model
    {
        [Key]
        [DatalistColumn]
        public Int16 Id { get; set; }
    }
}
